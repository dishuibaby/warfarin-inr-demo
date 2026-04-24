package service

import (
	"testing"
	"time"

	"warfarin-inr-demo/server/internal/model"
	"warfarin-inr-demo/server/internal/repository/memory"
)

func TestCreateINRUsesDefaultOffsetAndClassifiesAllTiers(t *testing.T) {
	svc, repo := newTestService(t, "2026-04-24T08:00:00Z")
	repo.UpdateSettings(model.UserSettings{
		TargetINRMin:          1.8,
		TargetINRMax:          2.5,
		DefaultMedicationTime: "08:00",
		TestCycle:             model.TestCycle{Unit: "week", Interval: 1},
		TestMethods:           []string{"hospital_lab", "home_device"},
		INROffset:             0.2,
	})

	cases := []struct {
		name          string
		rawValue      float64
		offset        *float64
		wantCorrected float64
		wantTrend     string
		wantTier      string
	}{
		{name: "normal uses default offset", rawValue: 2.0, wantCorrected: 2.2, wantTrend: "in_range", wantTier: "normal"},
		{name: "weak low within 0.1", rawValue: 1.71, offset: ptr(0), wantCorrected: 1.71, wantTrend: "low", wantTier: "weak_low"},
		{name: "strong low beyond 0.1", rawValue: 1.69, offset: ptr(0), wantCorrected: 1.69, wantTrend: "low", wantTier: "strong_low"},
		{name: "weak high within 0.1", rawValue: 2.59, offset: ptr(0), wantCorrected: 2.59, wantTrend: "high", wantTier: "weak_high"},
		{name: "strong high beyond 0.1", rawValue: 2.61, offset: ptr(0), wantCorrected: 2.61, wantTrend: "high", wantTier: "strong_high"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			record, err := svc.CreateINR(model.CreateINRRecordRequest{
				RawValue:   tc.rawValue,
				Offset:     tc.offset,
				TestMethod: "hospital_lab",
				TestedAt:   "2026-04-24T08:00:00Z",
			})
			if err != nil {
				t.Fatalf("CreateINR returned error: %v", err)
			}
			if record.CorrectedValue != tc.wantCorrected || record.Trend != tc.wantTrend || record.AbnormalTier != tc.wantTier {
				t.Fatalf("unexpected INR classification: got corrected=%v trend=%s tier=%s", record.CorrectedValue, record.Trend, record.AbnormalTier)
			}
			wantOffset := 0.2
			if tc.offset != nil {
				wantOffset = *tc.offset
			}
			if record.OffsetValue != wantOffset {
				t.Fatalf("record should preserve applied offset: got %v want %v", record.OffsetValue, wantOffset)
			}
		})
	}
}

func TestListINRTrendReturnsChronologicalRawAndCorrectedSeries(t *testing.T) {
	svc, _ := newTestService(t, "2026-04-24T08:00:00Z")

	for _, item := range []struct {
		raw      float64
		offset   float64
		testedAt string
	}{
		{raw: 2.0, offset: 0.1, testedAt: "2026-04-20T08:00:00Z"},
		{raw: 2.1, offset: 0.2, testedAt: "2026-04-22T08:00:00Z"},
		{raw: 2.2, offset: 0.3, testedAt: "2026-04-24T08:00:00Z"},
	} {
		offset := item.offset
		_, err := svc.CreateINR(model.CreateINRRecordRequest{
			RawValue:   item.raw,
			Offset:     &offset,
			TestMethod: "hospital_lab",
			TestedAt:   item.testedAt,
		})
		if err != nil {
			t.Fatalf("CreateINR returned error: %v", err)
		}
	}

	response := svc.ListINR()
	if len(response.Records) != 3 || response.Records[0].RawValue != 2.2 {
		t.Fatalf("records should be listed newest first: %#v", response.Records)
	}
	if len(response.Trend) != 3 {
		t.Fatalf("expected three trend points, got %#v", response.Trend)
	}
	want := []model.INRTrendPoint{
		{Date: "04-20", RawValue: 2.0, CorrectedValue: 2.1},
		{Date: "04-22", RawValue: 2.1, CorrectedValue: 2.3},
		{Date: "04-24", RawValue: 2.2, CorrectedValue: 2.5},
	}
	for i, point := range want {
		if response.Trend[i] != point {
			t.Fatalf("trend point %d mismatch: got %#v want %#v", i, response.Trend[i], point)
		}
	}
}

func TestHomeSummaryIncludesLatestINRNextTestAndProminentReminder(t *testing.T) {
	svc, repo := newTestService(t, "2026-04-24T08:00:00Z")
	repo.UpdateSettings(model.UserSettings{
		TargetINRMin:          1.8,
		TargetINRMax:          2.5,
		DefaultMedicationTime: "08:00",
		TestCycle:             model.TestCycle{Unit: "day", Interval: 3},
		TestMethods:           []string{"hospital_lab"},
		INROffset:             0,
	})

	_, err := svc.CreateINR(model.CreateINRRecordRequest{RawValue: 2.7, TestMethod: "hospital_lab", TestedAt: "2026-04-23T08:00:00Z"})
	if err != nil {
		t.Fatalf("CreateINR returned error: %v", err)
	}

	summary := svc.HomeSummary()
	if summary.LatestINR == nil || summary.LatestINR.CorrectedValue != 2.7 || summary.LatestINR.AbnormalTier != "strong_high" {
		t.Fatalf("summary should include latest corrected INR: %#v", summary.LatestINR)
	}
	if !summary.NextTestAt.Equal(mustParseTime(t, "2026-04-26T08:00:00Z")) {
		t.Fatalf("unexpected next test time: %s", summary.NextTestAt.Format(time.RFC3339))
	}
	if summary.ProminentReminder.Level != "strong" || summary.ProminentReminder.Title != "INR 结果需关注" {
		t.Fatalf("expected strong INR reminder, got %#v", summary.ProminentReminder)
	}
}

func TestCreateMedicationRecordsSystemTimeAndTomorrowDoseChoice(t *testing.T) {
	svc, _ := newTestService(t, "2026-04-24T09:30:00Z")

	manual, err := svc.CreateMedication(model.CreateMedicationRecordRequest{
		ActionType:          "taken",
		ActualDoseTablets:   1.5,
		TomorrowDoseMode:    "manual",
		TomorrowDoseTablets: ptr(1.25),
	})
	if err != nil {
		t.Fatalf("CreateMedication returned error: %v", err)
	}
	if !manual.RecordedAt.Equal(mustParseTime(t, "2026-04-24T09:30:00Z")) || manual.TomorrowDoseTablets == nil || *manual.TomorrowDoseTablets != 1.25 {
		t.Fatalf("manual medication record mismatch: %#v", manual)
	}

	planned, err := svc.CreateMedication(model.CreateMedicationRecordRequest{
		ActionType:        "taken",
		ActualDoseTablets: 1.25,
		TomorrowDoseMode:  "planned",
	})
	if err != nil {
		t.Fatalf("CreateMedication returned error: %v", err)
	}
	if planned.TomorrowDoseMode != "planned" || planned.TomorrowDoseTablets != nil {
		t.Fatalf("planned mode should not require manual tomorrow dose: %#v", planned)
	}
}

func TestUpdateSettingsValidatesTargetRange(t *testing.T) {
	svc, _ := newTestService(t, "2026-04-24T08:00:00Z")

	_, err := svc.UpdateSettings(model.UserSettings{
		TargetINRMin:          2.5,
		TargetINRMax:          1.8,
		DefaultMedicationTime: "08:00",
		TestCycle:             model.TestCycle{Unit: "week", Interval: 1},
		TestMethods:           []string{"hospital_lab"},
		INROffset:             0,
	})
	if err == nil {
		t.Fatalf("expected invalid target range to fail")
	}
}

func TestCreateINRRejectsInvalidTime(t *testing.T) {
	svc, _ := newTestService(t, "2026-04-24T08:00:00Z")

	_, err := svc.CreateINR(model.CreateINRRecordRequest{RawValue: 2.0, TestMethod: "hospital_lab", TestedAt: "2026-04-24 08:00"})
	if err == nil || err.Error() != "time must be RFC3339" {
		t.Fatalf("expected RFC3339 validation error, got %v", err)
	}
}

func newTestService(t *testing.T, now string) (*Service, *memory.Repository) {
	t.Helper()
	repo := memory.NewRepository()
	svc := New(repo)
	svc.now = func() time.Time { return mustParseTime(t, now) }
	return svc, repo
}

func mustParseTime(t *testing.T, value string) time.Time {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		t.Fatalf("failed to parse time %q: %v", value, err)
	}
	return parsed
}

func ptr(value float64) *float64 {
	return &value
}

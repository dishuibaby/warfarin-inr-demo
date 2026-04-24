package sqlite

import (
	"database/sql"
	"path/filepath"
	"testing"
	"time"

	_ "modernc.org/sqlite"

	"warfarin-inr-demo/server/internal/model"
)

func TestRepositoryPersistsINRAndSettings(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "warfarin.db")
	repo := newTestRepository(t, dbPath)

	settings := repo.GetSettings()
	if settings.TargetINRMin != 1.8 || settings.TargetINRMax != 2.5 || settings.TestCycle.Unit != "week" {
		t.Fatalf("unexpected default settings: %#v", settings)
	}

	updated := model.UserSettings{
		TargetINRMin:          2.0,
		TargetINRMax:          3.0,
		DefaultMedicationTime: "20:30",
		TestCycle:             model.TestCycle{Unit: "day", Interval: 3},
		TestMethods:           []string{"home_device", "other"},
		INROffset:             0.2,
	}
	repo.UpdateSettings(updated)

	earlier := repo.CreateINR(model.INRRecord{
		RawValue:       2.7,
		OffsetValue:    0.2,
		CorrectedValue: 2.9,
		AbnormalTier:   "strong_high",
		TestMethod:     "hospital_lab",
		TestedAt:       mustTime(t, "2026-04-24T08:00:00Z"),
	})
	later := repo.CreateINR(model.INRRecord{
		RawValue:       2.1,
		OffsetValue:    0.2,
		CorrectedValue: 2.3,
		AbnormalTier:   "normal",
		TestMethod:     "home_device",
		TestedAt:       mustTime(t, "2026-04-25T08:00:00Z"),
	})
	if earlier.ID != "inr-1" || later.ID != "inr-2" {
		t.Fatalf("unexpected INR ids: %s %s", earlier.ID, later.ID)
	}

	repo.Close()
	reopened := newTestRepository(t, dbPath)

	persistedSettings := reopened.GetSettings()
	if persistedSettings.DefaultMedicationTime != "20:30" || persistedSettings.INROffset != 0.2 || len(persistedSettings.TestMethods) != 2 {
		t.Fatalf("settings did not persist: %#v", persistedSettings)
	}

	records := reopened.ListINR()
	if len(records) != 2 || records[0].ID != "inr-2" || records[0].AbnormalTier != "normal" {
		t.Fatalf("INR records not persisted in descending tested order: %#v", records)
	}
	if records[0].OffsetValue != 0.2 || records[1].OffsetValue != 0.2 {
		t.Fatalf("INR offsets were not persisted: %#v", records)
	}
	latest := reopened.LatestINR()
	if latest == nil || latest.ID != "inr-2" {
		t.Fatalf("unexpected latest INR: %#v", latest)
	}
}

func TestRepositoryPersistsMedicationForDay(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "warfarin.db")
	repo := newTestRepository(t, dbPath)
	dose := 1.25

	created := repo.CreateMedication(model.MedicationRecord{
		ActionType:          "taken",
		ActualDoseTablets:   1.5,
		RecordedAt:          mustTime(t, "2026-04-24T09:00:00Z"),
		TomorrowDoseMode:    "manual",
		TomorrowDoseTablets: &dose,
	})
	if created.ID != "med-1" {
		t.Fatalf("unexpected medication id: %s", created.ID)
	}

	repo.Close()
	reopened := newTestRepository(t, dbPath)

	record := reopened.LatestMedicationOn(mustTime(t, "2026-04-24T12:00:00Z"))
	if record == nil || record.ID != "med-1" || record.TomorrowDoseTablets == nil || *record.TomorrowDoseTablets != dose {
		t.Fatalf("medication not found for day: %#v", record)
	}
	missing := reopened.LatestMedicationOn(mustTime(t, "2026-04-25T12:00:00Z"))
	if missing != nil {
		t.Fatalf("expected no medication on next day, got %#v", missing)
	}
}

func TestRepositoryMigratesLegacyINRRecordsWithoutOffset(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "legacy.db")
	db := openRawDB(t, dbPath)
	_, err := db.Exec(`
		CREATE TABLE inr_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			raw_value REAL NOT NULL,
			corrected_value REAL NOT NULL,
			trend TEXT NOT NULL DEFAULT 'in_range',
			abnormal_tier TEXT NOT NULL,
			test_method TEXT NOT NULL,
			tested_at TEXT NOT NULL
		);
		INSERT INTO inr_records (raw_value, corrected_value, trend, abnormal_tier, test_method, tested_at)
		VALUES (2.0, 2.0, 'in_range', 'normal', 'hospital_lab', '2026-04-20T08:00:00Z');
	`)
	if err != nil {
		t.Fatalf("failed to seed legacy schema: %v", err)
	}
	db.Close()

	repo := newTestRepository(t, dbPath)
	records := repo.ListINR()
	if len(records) != 1 || records[0].OffsetValue != 0 {
		t.Fatalf("legacy INR offset default mismatch: %#v", records)
	}
	created := repo.CreateINR(model.INRRecord{RawValue: 2.1, OffsetValue: 0.1, CorrectedValue: 2.2, Trend: "in_range", AbnormalTier: "normal", TestMethod: "hospital_lab", TestedAt: mustTime(t, "2026-04-24T08:00:00Z")})
	if created.ID != "inr-2" {
		t.Fatalf("unexpected migrated INR id: %s", created.ID)
	}
}

func openRawDB(t *testing.T, dbPath string) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("failed to open raw sqlite database: %v", err)
	}
	return db
}

func newTestRepository(t *testing.T, dbPath string) *Repository {
	t.Helper()
	repo, err := NewRepository(dbPath)
	if err != nil {
		t.Fatalf("failed to open sqlite repository: %v", err)
	}
	t.Cleanup(func() { repo.Close() })
	return repo
}

func mustTime(t *testing.T, value string) time.Time {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		t.Fatalf("failed to parse time: %v", err)
	}
	return parsed
}

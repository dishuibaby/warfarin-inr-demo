package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"inr_helper/server/internal/router"
)

type envelope struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func TestHealthz(t *testing.T) {
	r := router.New()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var body map[string]string
	decode(t, w.Body.Bytes(), &body)
	if body["status"] != "ok" {
		t.Fatalf("expected status ok, got %#v", body)
	}
}

func TestSettingsGetAndPut(t *testing.T) {
	r := router.New()

	initial := request(t, r, http.MethodGet, "/api/v1/settings", nil)
	if initial.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", initial.Code)
	}
	var initialEnvelope envelope
	decode(t, initial.Body.Bytes(), &initialEnvelope)
	if initialEnvelope.Code != 0 {
		t.Fatalf("expected envelope ok, got %#v", initialEnvelope)
	}

	payload := `{
		"targetInrMin":1.8,
		"targetInrMax":2.5,
		"defaultMedicationTime":"20:30",
		"testCycle":{"unit":"day","interval":3},
		"testMethods":["home_device"],
		"inrOffset":0.2
	}`
	updated := request(t, r, http.MethodPut, "/api/v1/settings", []byte(payload))
	if updated.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d body %s", updated.Code, updated.Body.String())
	}

	var updatedEnvelope envelope
	decode(t, updated.Body.Bytes(), &updatedEnvelope)
	var settings map[string]interface{}
	decode(t, updatedEnvelope.Data, &settings)
	if settings["defaultMedicationTime"] != "20:30" || settings["inrOffset"].(float64) != 0.2 {
		t.Fatalf("settings were not updated: %#v", settings)
	}
	settingsCopy := settings["displayText"].(map[string]interface{})
	if settingsCopy["locale"] != "zh-CN" || settingsCopy["testMethodTitle"] != "检测方式" || settingsCopy["saveAction"] != "保存设置" {
		t.Fatalf("settings should include server-provided display text: %#v", settingsCopy)
	}
}

func TestINRRecordsGetAndPost(t *testing.T) {
	r := router.New()

	payload := `{"rawValue":2.1,"offset":0.1,"testMethod":"hospital_lab","testedAt":"2026-04-24T08:00:00Z"}`
	created := request(t, r, http.MethodPost, "/api/v1/inr/records", []byte(payload))
	if created.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d body %s", created.Code, created.Body.String())
	}

	var createdEnvelope envelope
	decode(t, created.Body.Bytes(), &createdEnvelope)
	var record map[string]interface{}
	decode(t, createdEnvelope.Data, &record)
	if record["correctedValue"].(float64) != 2.2 || record["offsetValue"].(float64) != 0.1 || record["abnormalTier"] != "normal" || record["trend"] != "in_range" {
		t.Fatalf("unexpected INR record: %#v", record)
	}
	createdDisplay := record["displayText"].(map[string]interface{})
	if createdDisplay["statusLabel"] != "正常" || createdDisplay["rawLabel"] != "校准前" {
		t.Fatalf("created INR record should include display text from server: %#v", createdDisplay)
	}

	weakPayload := `{"rawValue":2.56,"offset":0,"testMethod":"hospital_lab","testedAt":"2026-04-25T08:00:00Z"}`
	weak := request(t, r, http.MethodPost, "/api/v1/inr/records", []byte(weakPayload))
	if weak.Code != http.StatusOK {
		t.Fatalf("expected weak status 200, got %d body %s", weak.Code, weak.Body.String())
	}
	var weakEnvelope envelope
	decode(t, weak.Body.Bytes(), &weakEnvelope)
	var weakRecord map[string]interface{}
	decode(t, weakEnvelope.Data, &weakRecord)
	if weakRecord["abnormalTier"] != "weak_high" || weakRecord["trend"] != "high" {
		t.Fatalf("expected weak_high for +0.06 above max, got %#v", weakRecord)
	}

	strongPayload := `{"rawValue":2.7,"offset":0,"testMethod":"hospital_lab","testedAt":"2026-04-26T08:00:00Z"}`
	strong := request(t, r, http.MethodPost, "/api/v1/inr/records", []byte(strongPayload))
	if strong.Code != http.StatusOK {
		t.Fatalf("expected strong status 200, got %d body %s", strong.Code, strong.Body.String())
	}
	var strongEnvelope envelope
	decode(t, strong.Body.Bytes(), &strongEnvelope)
	var strongRecord map[string]interface{}
	decode(t, strongEnvelope.Data, &strongRecord)
	if strongRecord["abnormalTier"] != "strong_high" {
		t.Fatalf("expected strong_high for +0.2 above max, got %#v", strongRecord)
	}

	listed := request(t, r, http.MethodGet, "/api/v1/inr/records", nil)
	if listed.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", listed.Code)
	}
	var listEnvelope envelope
	decode(t, listed.Body.Bytes(), &listEnvelope)
	var recordsResponse struct {
		Records     []map[string]interface{} `json:"records"`
		Trend       []map[string]interface{} `json:"trend"`
		TargetRange map[string]interface{}   `json:"targetRange"`
		DisplayText map[string]interface{}   `json:"displayText"`
	}
	decode(t, listEnvelope.Data, &recordsResponse)
	if len(recordsResponse.Records) != 3 || recordsResponse.Records[0]["id"] == "" || len(recordsResponse.Trend) != 3 {
		t.Fatalf("expected three persisted INR records and trend points, got %#v", recordsResponse)
	}
	if recordsResponse.TargetRange["min"].(float64) != 1.8 || recordsResponse.TargetRange["max"].(float64) != 2.5 {
		t.Fatalf("target range missing from INR response: %#v", recordsResponse.TargetRange)
	}
	if recordsResponse.Records[2]["offsetValue"].(float64) != 0.1 || recordsResponse.Trend[0]["rawValue"].(float64) != 2.1 || recordsResponse.Trend[0]["correctedValue"].(float64) != 2.2 {
		t.Fatalf("INR response should expose raw/corrected/offset contract fields: %#v", recordsResponse)
	}
	trendCopy := recordsResponse.DisplayText["trend"].(map[string]interface{})
	labelsCopy := recordsResponse.DisplayText["recordLabels"].(map[string]interface{})
	if recordsResponse.DisplayText["locale"] != "zh-CN" || trendCopy["correctedSeriesLabel"] != "校准后" || labelsCopy["strongHigh"] != "强提示" {
		t.Fatalf("INR list should include server-provided display text: %#v", recordsResponse.DisplayText)
	}
}

func TestMedicationRecordAndHomeSummary(t *testing.T) {
	r := router.New()

	medicationPayload := `{
		"actionType":"taken",
		"actualDoseTablets":1.5,
		"tomorrowDoseMode":"manual",
		"tomorrowDoseTablets":1.25
	}`
	created := request(t, r, http.MethodPost, "/api/v1/medication/records", []byte(medicationPayload))
	if created.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d body %s", created.Code, created.Body.String())
	}
	var createdEnvelope envelope
	decode(t, created.Body.Bytes(), &createdEnvelope)
	var medication map[string]interface{}
	decode(t, createdEnvelope.Data, &medication)
	if medication["actionType"] != "taken" || medication["tomorrowDoseMode"] != "manual" {
		t.Fatalf("unexpected medication record: %#v", medication)
	}

	summaryResponse := request(t, r, http.MethodGet, "/api/v1/home/summary", nil)
	if summaryResponse.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", summaryResponse.Code)
	}
	var summaryEnvelope envelope
	decode(t, summaryResponse.Body.Bytes(), &summaryEnvelope)
	var summary map[string]interface{}
	decode(t, summaryEnvelope.Data, &summary)
	if summary["prominentReminder"] == nil || summary["nextTestAt"] == "" || summary["todayMedication"] == nil {
		t.Fatalf("summary missing required fields: %#v", summary)
	}
	displayText := summary["displayText"].(map[string]interface{})
	todayCopy := displayText["todayMedication"].(map[string]interface{})
	if displayText["locale"] != "zh-CN" || todayCopy["primaryAction"] != "完成服药" || todayCopy["tomorrowDoseTitle"] != "选择明日剂量" {
		t.Fatalf("home summary should include server-provided display text: %#v", displayText)
	}
}

func request(t *testing.T, r http.Handler, method string, path string, body []byte) *httptest.ResponseRecorder {
	t.Helper()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	r.ServeHTTP(w, req)
	return w
}

func decode(t *testing.T, data []byte, target interface{}) {
	t.Helper()
	if err := json.Unmarshal(data, target); err != nil {
		t.Fatalf("failed to decode JSON %s: %v", string(data), err)
	}
}

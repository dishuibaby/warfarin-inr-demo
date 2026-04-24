package model

import "time"

type Envelope struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type Reminder struct {
	Level string `json:"level"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

type TodayMedication struct {
	Status             string  `json:"status"`
	PlannedDoseTablets float64 `json:"plannedDoseTablets"`
}

type HomeSummary struct {
	ProminentReminder Reminder        `json:"prominentReminder"`
	LatestINR         *INRRecord      `json:"latestInr"`
	NextTestAt        time.Time       `json:"nextTestAt"`
	TodayMedication   TodayMedication `json:"todayMedication"`
}

type MedicationRecord struct {
	ID                  string    `json:"id"`
	ActionType          string    `json:"actionType"`
	ActualDoseTablets   float64   `json:"actualDoseTablets"`
	RecordedAt          time.Time `json:"recordedAt"`
	TomorrowDoseMode    string    `json:"tomorrowDoseMode"`
	TomorrowDoseTablets *float64  `json:"tomorrowDoseTablets,omitempty"`
}

type CreateMedicationRecordRequest struct {
	ActionType          string   `json:"actionType" binding:"required,oneof=taken paused missed"`
	ActualDoseTablets   float64  `json:"actualDoseTablets"`
	TomorrowDoseMode    string   `json:"tomorrowDoseMode" binding:"required,oneof=planned manual"`
	TomorrowDoseTablets *float64 `json:"tomorrowDoseTablets"`
}

type INRRecord struct {
	ID             string    `json:"id"`
	RawValue       float64   `json:"rawValue"`
	OffsetValue    float64   `json:"offsetValue"`
	CorrectedValue float64   `json:"correctedValue"`
	Trend          string    `json:"trend"`
	AbnormalTier   string    `json:"abnormalTier"`
	TestMethod     string    `json:"testMethod"`
	TestedAt       time.Time `json:"testedAt"`
}

type INRTrendPoint struct {
	Date           string  `json:"date"`
	RawValue       float64 `json:"rawValue"`
	CorrectedValue float64 `json:"correctedValue"`
}

type INRRecordsResponse struct {
	Records     []INRRecord     `json:"records"`
	Trend       []INRTrendPoint `json:"trend"`
	TargetRange TargetRange     `json:"targetRange"`
}

type TargetRange struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
}

type CreateINRRecordRequest struct {
	RawValue   float64  `json:"rawValue" binding:"required,gt=0"`
	Offset     *float64 `json:"offset"`
	TestMethod string   `json:"testMethod" binding:"required,oneof=hospital_lab poct_device home_device other"`
	TestedAt   string   `json:"testedAt" binding:"required"`
}

type TestCycle struct {
	Unit     string `json:"unit" binding:"required,oneof=day week month"`
	Interval int    `json:"interval" binding:"required,min=1"`
}

type UserSettings struct {
	TargetINRMin          float64   `json:"targetInrMin"`
	TargetINRMax          float64   `json:"targetInrMax"`
	DefaultMedicationTime string    `json:"defaultMedicationTime"`
	TestCycle             TestCycle `json:"testCycle" binding:"required"`
	TestMethods           []string  `json:"testMethods" binding:"required,min=1,dive,oneof=hospital_lab poct_device home_device other"`
	INROffset             float64   `json:"inrOffset"`
}

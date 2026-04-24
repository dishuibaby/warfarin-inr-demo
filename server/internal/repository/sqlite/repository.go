package sqlite

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"warfarin-inr-demo/server/internal/model"
)

const schema = `
CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    actual_dose_tablets REAL NOT NULL,
    client_time TEXT,
    recorded_at TEXT NOT NULL,
    tomorrow_dose_mode TEXT NOT NULL,
    tomorrow_dose_tablets REAL
);

CREATE INDEX IF NOT EXISTS idx_medications_recorded_at ON medications(recorded_at);

CREATE TABLE IF NOT EXISTS inr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_value REAL NOT NULL,
    offset_value REAL NOT NULL DEFAULT 0,
    corrected_value REAL NOT NULL,
    trend TEXT NOT NULL DEFAULT 'in_range',
    abnormal_tier TEXT NOT NULL,
    test_method TEXT NOT NULL,
    tested_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inr_records_tested_at ON inr_records(tested_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    target_inr_min REAL NOT NULL,
    target_inr_max REAL NOT NULL,
    default_medication_time TEXT NOT NULL,
    test_cycle_unit TEXT NOT NULL,
    test_cycle_interval INTEGER NOT NULL,
    test_methods TEXT NOT NULL,
    inr_offset REAL NOT NULL
);

INSERT INTO settings (
    id,
    target_inr_min,
    target_inr_max,
    default_medication_time,
    test_cycle_unit,
    test_cycle_interval,
    test_methods,
    inr_offset
)
VALUES (1, 1.8, 2.5, '08:00', 'week', 1, '["hospital_lab","poct_device"]', 0)
ON CONFLICT(id) DO NOTHING;
`

type Repository struct {
	db *sql.DB
}

func NewRepository(dsn string) (*Repository, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, fmt.Errorf("sqlite database path is required")
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	repo := &Repository{db: db}
	if err := repo.Migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return repo, nil
}

func (r *Repository) Close() error {
	return r.db.Close()
}

func (r *Repository) Migrate() error {
	if _, err := r.db.Exec(schema); err != nil {
		return err
	}
	return r.ensureColumn("inr_records", "offset_value", "ALTER TABLE inr_records ADD COLUMN offset_value REAL NOT NULL DEFAULT 0")
}

func (r *Repository) ensureColumn(table string, column string, statement string) error {
	rows, err := r.db.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var (
			cid        int
			name       string
			columnType string
			notNull    int
			defaultVal sql.NullString
			pk         int
		)
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultVal, &pk); err != nil {
			return err
		}
		if name == column {
			return nil
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	_, err = r.db.Exec(statement)
	return err
}

func (r *Repository) CreateMedication(record model.MedicationRecord) model.MedicationRecord {
	result, err := r.db.Exec(`
		INSERT INTO medications (action_type, actual_dose_tablets, client_time, recorded_at, tomorrow_dose_mode, tomorrow_dose_tablets)
		VALUES (?, ?, ?, ?, ?, ?)
	`, record.ActionType, record.ActualDoseTablets, nil, formatTime(record.RecordedAt), record.TomorrowDoseMode, record.TomorrowDoseTablets)
	if err != nil {
		panic(err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		panic(err)
	}
	record.ID = fmt.Sprintf("med-%d", id)
	return record
}

func (r *Repository) LatestMedicationOn(day time.Time) *model.MedicationRecord {
	rows, err := r.db.Query(`
		SELECT id, action_type, actual_dose_tablets, client_time, recorded_at, tomorrow_dose_mode, tomorrow_dose_tablets
		FROM medications
		ORDER BY id DESC
	`)
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		record := scanMedication(rows)
		if sameDay(record.RecordedAt, day) {
			return &record
		}
	}
	if err := rows.Err(); err != nil {
		panic(err)
	}
	return nil
}

func (r *Repository) CreateINR(record model.INRRecord) model.INRRecord {
	result, err := r.db.Exec(`
		INSERT INTO inr_records (raw_value, offset_value, corrected_value, trend, abnormal_tier, test_method, tested_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, record.RawValue, record.OffsetValue, record.CorrectedValue, record.Trend, record.AbnormalTier, record.TestMethod, formatTime(record.TestedAt))
	if err != nil {
		panic(err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		panic(err)
	}
	record.ID = fmt.Sprintf("inr-%d", id)
	return record
}

func (r *Repository) ListINR() []model.INRRecord {
	rows, err := r.db.Query(`
		SELECT id, raw_value, offset_value, corrected_value, trend, abnormal_tier, test_method, tested_at
		FROM inr_records
		ORDER BY tested_at DESC, id DESC
	`)
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	records := []model.INRRecord{}
	for rows.Next() {
		records = append(records, scanINR(rows))
	}
	if err := rows.Err(); err != nil {
		panic(err)
	}
	return records
}

func (r *Repository) LatestINR() *model.INRRecord {
	row := r.db.QueryRow(`
		SELECT id, raw_value, offset_value, corrected_value, trend, abnormal_tier, test_method, tested_at
		FROM inr_records
		ORDER BY tested_at DESC, id DESC
		LIMIT 1
	`)
	record, err := scanINRRow(row)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		panic(err)
	}
	return &record
}

func (r *Repository) GetSettings() model.UserSettings {
	row := r.db.QueryRow(`
		SELECT target_inr_min, target_inr_max, default_medication_time, test_cycle_unit, test_cycle_interval, test_methods, inr_offset
		FROM settings
		WHERE id = 1
	`)
	settings, err := scanSettings(row)
	if err != nil {
		panic(err)
	}
	return settings
}

func (r *Repository) UpdateSettings(settings model.UserSettings) model.UserSettings {
	methods, err := json.Marshal(settings.TestMethods)
	if err != nil {
		panic(err)
	}
	_, err = r.db.Exec(`
		UPDATE settings
		SET target_inr_min = ?, target_inr_max = ?, default_medication_time = ?, test_cycle_unit = ?, test_cycle_interval = ?, test_methods = ?, inr_offset = ?
		WHERE id = 1
	`, settings.TargetINRMin, settings.TargetINRMax, settings.DefaultMedicationTime, settings.TestCycle.Unit, settings.TestCycle.Interval, string(methods), settings.INROffset)
	if err != nil {
		panic(err)
	}
	settings.TestMethods = append([]string(nil), settings.TestMethods...)
	return settings
}

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanMedication(rows *sql.Rows) model.MedicationRecord {
	var (
		id                     int64
		clientTime             sql.NullString
		recordedAt             string
		tomorrowDoseTablets    sql.NullFloat64
		tomorrowDoseTabletsPtr *float64
		record                 model.MedicationRecord
	)
	if err := rows.Scan(&id, &record.ActionType, &record.ActualDoseTablets, &clientTime, &recordedAt, &record.TomorrowDoseMode, &tomorrowDoseTablets); err != nil {
		panic(err)
	}
	record.ID = fmt.Sprintf("med-%d", id)
	_ = clientTime
	record.RecordedAt = parseDBTime(recordedAt)
	if tomorrowDoseTablets.Valid {
		value := tomorrowDoseTablets.Float64
		tomorrowDoseTabletsPtr = &value
	}
	record.TomorrowDoseTablets = tomorrowDoseTabletsPtr
	return record
}

func scanINR(rows *sql.Rows) model.INRRecord {
	record, err := scanINRRow(rows)
	if err != nil {
		panic(err)
	}
	return record
}

func scanINRRow(row scanner) (model.INRRecord, error) {
	var id int64
	var testedAt string
	var record model.INRRecord
	if err := row.Scan(&id, &record.RawValue, &record.OffsetValue, &record.CorrectedValue, &record.Trend, &record.AbnormalTier, &record.TestMethod, &testedAt); err != nil {
		return model.INRRecord{}, err
	}
	record.ID = fmt.Sprintf("inr-%d", id)
	record.TestedAt = parseDBTime(testedAt)
	return record, nil
}

func scanSettings(row scanner) (model.UserSettings, error) {
	var methods string
	settings := model.UserSettings{}
	if err := row.Scan(&settings.TargetINRMin, &settings.TargetINRMax, &settings.DefaultMedicationTime, &settings.TestCycle.Unit, &settings.TestCycle.Interval, &methods, &settings.INROffset); err != nil {
		return model.UserSettings{}, err
	}
	if err := json.Unmarshal([]byte(methods), &settings.TestMethods); err != nil {
		return model.UserSettings{}, err
	}
	settings.TestMethods = append([]string(nil), settings.TestMethods...)
	return settings, nil
}

func nullableTime(value time.Time) interface{} {
	if value.IsZero() {
		return nil
	}
	return formatTime(value)
}

func formatTime(value time.Time) string {
	return value.UTC().Format(time.RFC3339Nano)
}

func parseDBTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		panic(err)
	}
	return parsed
}

func sameDay(a time.Time, b time.Time) bool {
	a = a.In(b.Location())
	return a.Year() == b.Year() && a.YearDay() == b.YearDay()
}

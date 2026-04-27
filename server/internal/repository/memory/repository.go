package memory

import (
	"fmt"
	"sort"
	"sync"
	"time"

	"inr_helper/server/internal/model"
)

type Repository struct {
	mu          sync.RWMutex
	medications []model.MedicationRecord
	inrs        []model.INRRecord
	settings    model.UserSettings
	nextID      int
}

func NewRepository() *Repository {
	return &Repository{
		settings: model.UserSettings{
			TargetINRMin:          1.8,
			TargetINRMax:          2.5,
			DefaultMedicationTime: "08:00",
			TestCycle:             model.TestCycle{Unit: "week", Interval: 1},
			TestMethods:           []string{"hospital_lab", "poct_device"},
			INROffset:             0,
		},
		nextID: 1,
	}
}

func (r *Repository) CreateMedication(record model.MedicationRecord) model.MedicationRecord {
	r.mu.Lock()
	defer r.mu.Unlock()
	record.ID = r.idLocked("med")
	r.medications = append(r.medications, record)
	return record
}

func (r *Repository) LatestMedicationOn(day time.Time) *model.MedicationRecord {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for i := len(r.medications) - 1; i >= 0; i-- {
		recordedAt := r.medications[i].RecordedAt
		if recordedAt.Year() == day.Year() && recordedAt.YearDay() == day.YearDay() {
			record := r.medications[i]
			return &record
		}
	}
	return nil
}

func (r *Repository) CreateINR(record model.INRRecord) model.INRRecord {
	r.mu.Lock()
	defer r.mu.Unlock()
	record.ID = r.idLocked("inr")
	r.inrs = append(r.inrs, record)
	return record
}

func (r *Repository) ListINR() []model.INRRecord {
	r.mu.RLock()
	defer r.mu.RUnlock()
	records := append([]model.INRRecord(nil), r.inrs...)
	sort.Slice(records, func(i, j int) bool {
		return records[i].TestedAt.After(records[j].TestedAt)
	})
	return records
}

func (r *Repository) LatestINR() *model.INRRecord {
	records := r.ListINR()
	if len(records) == 0 {
		return nil
	}
	return &records[0]
}

func (r *Repository) GetSettings() model.UserSettings {
	r.mu.RLock()
	defer r.mu.RUnlock()
	settings := r.settings
	settings.TestMethods = append([]string(nil), r.settings.TestMethods...)
	return settings
}

func (r *Repository) UpdateSettings(settings model.UserSettings) model.UserSettings {
	r.mu.Lock()
	defer r.mu.Unlock()
	settings.TestMethods = append([]string(nil), settings.TestMethods...)
	r.settings = settings
	return r.settings
}

func (r *Repository) idLocked(prefix string) string {
	id := fmt.Sprintf("%s-%d", prefix, r.nextID)
	r.nextID++
	return id
}

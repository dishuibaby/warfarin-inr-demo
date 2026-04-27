package router

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"inr_helper/server/internal/config"
	"inr_helper/server/internal/handler"
	"inr_helper/server/internal/repository"
	"inr_helper/server/internal/repository/memory"
	sqliterepo "inr_helper/server/internal/repository/sqlite"
	"inr_helper/server/internal/service"
)

func New() *gin.Engine {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	return NewWithConfig(cfg)
}

func NewWithConfig(cfg config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	repo, err := newRepository(cfg.Database)
	if err != nil {
		panic(err)
	}
	svc := service.New(repo)
	h := handler.New(svc)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.GET("/healthz", h.Health)

	v1 := r.Group("/api/v1")
	v1.GET("/home/summary", h.HomeSummary)
	v1.POST("/medication/records", h.CreateMedicationRecord)
	v1.GET("/inr/records", h.ListINRRecords)
	v1.POST("/inr/records", h.CreateINRRecord)
	v1.GET("/settings", h.GetSettings)
	v1.PUT("/settings", h.UpdateSettings)

	return r
}

func newRepository(cfg config.DatabaseConfig) (repository.Repository, error) {
	switch cfg.Engine {
	case config.DatabaseEngineMemory:
		return memory.NewRepository(), nil
	case config.DatabaseEngineSQLite:
		dsn := cfg.URL
		if dsn == "" {
			dsn = cfg.SQLitePath
		}
		return sqliterepo.NewRepository(dsn)
	case config.DatabaseEngineMySQL:
		return nil, fmt.Errorf("DB_ENGINE=mysql is planned but not implemented; use DB_ENGINE=memory or DB_ENGINE=sqlite")
	default:
		return nil, fmt.Errorf("unsupported DB_ENGINE %q", cfg.Engine)
	}
}

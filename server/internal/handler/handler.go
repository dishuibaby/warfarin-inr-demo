package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"inr_helper/server/internal/model"
	"inr_helper/server/internal/service"
)

type Handler struct {
	service *service.Service
}

func New(service *service.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) HomeSummary(c *gin.Context) {
	ok(c, h.service.HomeSummary())
}

func (h *Handler) CreateMedicationRecord(c *gin.Context) {
	var req model.CreateMedicationRecordRequest
	if !bindJSON(c, &req) {
		return
	}
	record, err := h.service.CreateMedication(req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, record)
}

func (h *Handler) ListINRRecords(c *gin.Context) {
	ok(c, h.service.ListINR())
}

func (h *Handler) CreateINRRecord(c *gin.Context) {
	var req model.CreateINRRecordRequest
	if !bindJSON(c, &req) {
		return
	}
	record, err := h.service.CreateINR(req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, record)
}

func (h *Handler) GetSettings(c *gin.Context) {
	ok(c, h.service.GetSettings())
}

func (h *Handler) UpdateSettings(c *gin.Context) {
	var req model.UserSettings
	if !bindJSON(c, &req) {
		return
	}
	settings, err := h.service.UpdateSettings(req)
	if err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, settings)
}

func bindJSON(c *gin.Context, target interface{}) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		badRequest(c, err.Error())
		return false
	}
	return true
}

func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, model.Envelope{Code: 0, Message: "ok", Data: data})
}

func badRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, model.Envelope{Code: 400, Message: message})
}

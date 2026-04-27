package service

import (
	"fmt"

	"inr_helper/server/internal/model"
)

func homeSummaryDisplayText(settings model.UserSettings, todayMedication model.TodayMedication) model.HomeSummaryDisplayText {
	return model.HomeSummaryDisplayText{
		Locale: "zh-CN",
		LatestINR: model.LatestINRDisplayText{
			Label:       "最新 INR",
			TargetLabel: fmt.Sprintf("目标 %.1f–%.1f", settings.TargetINRMin, settings.TargetINRMax),
			RawLabel:    "校准前",
		},
		NextTest: model.NextTestDisplayText{
			Label:     "下次检测",
			CycleText: cycleText(settings.TestCycle),
		},
		TodayMedication: model.TodayMedicationDisplayText{
			Title:             "今日服药",
			PrimaryAction:     "完成服药",
			PauseAction:       "停服",
			MissAction:        "漏服",
			YesterdayDoseText: "昨日服药量：1.5 片",
			StatusText:        medicationStatusText(todayMedication.Status),
			TomorrowDoseTitle: "选择明日剂量",
			PlannedDoseLabel:  "按计划服用",
			ManualDoseLabel:   "手动输入",
			RecordedAtHint:    "系统记录当前操作时间作为服药时间",
			ConfirmAction:     "确认明日剂量",
		},
	}
}

func inrRecordsDisplayText() model.INRRecordsDisplayText {
	return model.INRRecordsDisplayText{
		Locale: "zh-CN",
		Trend: model.INRTrendDisplayText{
			Title:                "INR 趋势",
			Subtitle:             "校准后 / 校准前",
			CorrectedSeriesLabel: "校准后",
			RawSeriesLabel:       "校准前",
			StrongLabel:          "强异常",
			WeakLabel:            "弱提示",
		},
		RecordLabels: model.INRRecordLabelsDisplayText{
			Normal:     "正常",
			WeakLow:    "弱提示",
			StrongLow:  "强提示",
			WeakHigh:   "弱提示",
			StrongHigh: "强提示",
		},
		RecordsTitle: "INR 检测记录",
		RecordsHint:  "校准后为主，校准前作为参考",
	}
}

func withINRDisplayText(record model.INRRecord, settings model.UserSettings) model.INRRecord {
	record.DisplayText = model.INRRecordDisplayText{
		StatusLabel: inrStatusLabel(record.AbnormalTier),
		Note:        inrNote(record, settings),
		RawLabel:    "校准前",
		MethodLabel: testMethodLabel(record.TestMethod),
	}
	return record
}

func cycleText(cycle model.TestCycle) string {
	unit := map[string]string{"day": "天", "week": "周", "month": "月"}[cycle.Unit]
	if unit == "" {
		unit = "周"
	}
	return fmt.Sprintf("每 %d %s", cycle.Interval, unit)
}

func medicationStatusText(status string) string {
	switch status {
	case "taken":
		return "状态：已完成"
	case "paused":
		return "状态：停服"
	case "missed":
		return "状态：漏服"
	default:
		return "状态：待完成"
	}
}

func inrStatusLabel(tier string) string {
	switch tier {
	case "weak_low", "weak_high":
		return "弱提示"
	case "strong_low", "strong_high":
		return "强提示"
	default:
		return "正常"
	}
}

func inrNote(record model.INRRecord, settings model.UserSettings) string {
	switch record.AbnormalTier {
	case "weak_low":
		return "低于目标下限 0.1 以内，弱提示，请按计划复测并持续记录。"
	case "strong_low":
		return fmt.Sprintf("低于目标下限 %.1f 超过 0.1，强提示，请复测并咨询医生。", settings.TargetINRMin)
	case "weak_high":
		return "高于目标上限 0.1 以内，弱提示，请按计划复测并持续记录。"
	case "strong_high":
		return fmt.Sprintf("高于目标上限 %.1f 超过 0.1，强提示，请复测并咨询医生。", settings.TargetINRMax)
	default:
		return "处于目标范围，继续按周期记录与复测。"
	}
}

func settingsDisplayText(settings model.UserSettings) model.SettingsDisplayText {
	return model.SettingsDisplayText{
		Locale:              "zh-CN",
		INRRangeTitle:       "目标 INR 范围",
		INRRangeHint:        fmt.Sprintf("当前目标 %.1f–%.1f，异常提示按 ±0.1 分层", settings.TargetINRMin, settings.TargetINRMax),
		TestMethodTitle:     "检测方式",
		TestMethodHint:      "可选择医院静脉血、POCT 或家用指尖血设备",
		OffsetTitle:         "检测偏移量",
		OffsetHint:          "全站优先显示校准后 INR，校准前数值弱展示",
		CycleTitle:          "检测周期",
		CycleHint:           cycleText(settings.TestCycle),
		MedicationTimeTitle: "默认服药时间",
		SaveAction:          "保存设置",
	}
}

func testMethodLabel(method string) string {
	switch method {
	case "hospital_lab":
		return "医院静脉血"
	case "poct_device":
		return "POCT INR 仪"
	case "home_device":
		return "家用指尖血 INR 仪"
	default:
		return "其他方式"
	}
}

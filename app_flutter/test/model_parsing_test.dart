import 'package:flutter_test/flutter_test.dart';
import 'package:warfarin_inr_app/domain/models/home_summary.dart';
import 'package:warfarin_inr_app/domain/models/inr.dart';
import 'package:warfarin_inr_app/domain/models/medication.dart';
import 'package:warfarin_inr_app/domain/models/settings.dart';

void main() {
  test('parses home summary contract fields with latest INR and next test time', () {
    final summary = HomeSummary.fromJson({
      'prominentReminder': {'level': 'strong', 'title': '今日待服药', 'body': '请记录'},
      'latestInr': {
        'id': 'inr-1',
        'rawValue': 2.1,
        'correctedValue': 2.2,
        'trend': 'in_range',
        'abnormalTier': 'normal',
        'testMethod': 'hospital_lab',
        'testedAt': '2026-04-24T08:00:00Z',
      },
      'nextTestAt': '2026-05-01T08:00:00Z',
      'todayMedication': {'status': 'pending', 'plannedDoseTablets': 1.5},
    });

    expect(summary.latestInr?.rawValue, 2.1);
    expect(summary.latestInr?.correctedValue, 2.2);
    expect(summary.latestInr?.trend, InrTrend.inRange);
    expect(summary.latestInr?.testMethod, TestMethod.hospitalLab);
    expect(summary.nextTestAt.toUtc().toIso8601String(), '2026-05-01T08:00:00.000Z');
    expect(summary.todayMedication.status, MedicationStatus.pending);
    expect(summary.todayMedication.plannedDoseTablets, 1.5);
  });

  test('parses INR abnormal tier and falls back safely for unknown enum values', () {
    final weakHigh = InrRecord.fromJson({
      'id': 'inr-2',
      'rawValue': 2.56,
      'correctedValue': 2.56,
      'trend': 'high',
      'abnormalTier': 'weak_high',
      'testMethod': 'home_device',
      'testedAt': '2026-04-25T08:00:00Z',
    });
    final fallback = InrRecord.fromJson({
      'abnormalTier': 'future_tier',
      'testMethod': 'future_method',
    });

    expect(weakHigh.trend, InrTrend.high);
    expect(weakHigh.abnormalTier, AbnormalTier.weakHigh);
    expect(weakHigh.testMethod, TestMethod.homeDevice);
    expect(fallback.trend, InrTrend.inRange);
    expect(fallback.abnormalTier, AbnormalTier.normal);
    expect(fallback.testMethod, TestMethod.other);
  });

  test('serializes medication request for planned and manual tomorrow dose modes', () {
    final planned = const CreateMedicationRecordRequest(
      actionType: MedicationActionType.taken,
      actualDoseTablets: 1.5,
      tomorrowDoseMode: TomorrowDoseMode.planned,
    ).toJson();
    final manual = const CreateMedicationRecordRequest(
      actionType: MedicationActionType.taken,
      actualDoseTablets: 1.5,
      tomorrowDoseMode: TomorrowDoseMode.manual,
      tomorrowDoseTablets: 1.25,
    ).toJson();

    expect(planned, {
      'actionType': 'taken',
      'actualDoseTablets': 1.5,
      'tomorrowDoseMode': 'planned',
    });
    expect(manual['tomorrowDoseMode'], 'manual');
    expect(manual['tomorrowDoseTablets'], 1.25);
  });

  test('serializes INR request with UTC time and optional offset', () {
    final request = CreateInrRecordRequest(
      rawValue: 2.1,
      offset: 0.2,
      testMethod: TestMethod.poctDevice,
      testedAt: DateTime.parse('2026-04-24T16:00:00+08:00'),
    ).toJson();

    expect(request['rawValue'], 2.1);
    expect(request['offset'], 0.2);
    expect(request['testMethod'], 'poct_device');
    expect(request['testedAt'], '2026-04-24T08:00:00.000Z');
  });

  test('parses settings test cycle and serializes day week month units', () {
    final settings = UserSettings.fromJson({
      'targetInrMin': 1.8,
      'targetInrMax': 2.5,
      'defaultMedicationTime': '08:00',
      'testCycle': {'unit': 'month', 'interval': 1},
      'testMethods': ['hospital_lab', 'poct_device'],
      'inrOffset': -0.1,
    });

    expect(settings.testCycle.unit, TestCycleUnit.month);
    expect(settings.testCycle.interval, 1);
    expect(settings.toJson()['testCycle'], {'unit': 'month', 'interval': 1});
    expect(settings.testMethods, ['hospital_lab', 'poct_device']);
    expect(settings.inrOffset, -0.1);
  });
}

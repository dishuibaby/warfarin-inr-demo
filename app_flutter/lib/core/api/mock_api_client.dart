import '../../domain/models/home_summary.dart';
import '../../domain/models/inr.dart';
import '../../domain/models/medication.dart';
import '../../domain/models/reminder.dart';
import '../../domain/models/settings.dart';
import 'api_client.dart';

class MockApiClient implements ApiClient {
  MockApiClient() : _inrRecords = _seedInrRecords();

  final List<InrRecord> _inrRecords;
  MedicationStatus _todayStatus = MedicationStatus.pending;

  @override
  Future<HomeSummary> fetchHomeSummary() async {
    return HomeSummary(
      prominentReminder: Reminder(
        level: _todayStatus == MedicationStatus.pending ? ReminderLevel.strong : ReminderLevel.normal,
        title: _todayStatus == MedicationStatus.pending ? '今日待服药' : '今日已记录',
        body: _todayStatus == MedicationStatus.pending ? '请按医嘱服药，完成后记录实际剂量。' : '继续关注下次 INR 检测。',
      ),
      latestInr: _inrRecords.first,
      nextTestAt: DateTime.now().add(const Duration(days: 7)),
      todayMedication: TodayMedication(status: _todayStatus, plannedDoseTablets: 1.5),
    );
  }

  @override
  Future<MedicationRecord> createMedicationRecord(CreateMedicationRecordRequest request) async {
    _todayStatus = switch (request.actionType) {
      MedicationActionType.taken => MedicationStatus.taken,
      MedicationActionType.paused => MedicationStatus.paused,
      MedicationActionType.missed => MedicationStatus.missed,
    };
    return MedicationRecord(
      id: 'local-med-${DateTime.now().millisecondsSinceEpoch}',
      actionType: request.actionType,
      actualDoseTablets: request.actualDoseTablets,
      recordedAt: DateTime.now(),
      tomorrowDoseMode: request.tomorrowDoseMode,
      tomorrowDoseTablets: request.tomorrowDoseTablets,
    );
  }

  @override
  Future<List<InrRecord>> fetchInrRecords() async => List.unmodifiable(_inrRecords);

  @override
  Future<InrRecord> createInrRecord(CreateInrRecordRequest request) async {
    final correctedValue = _roundInr(request.rawValue + (request.offset ?? 0));
    final record = InrRecord(
      id: 'local-inr-${DateTime.now().millisecondsSinceEpoch}',
      rawValue: request.rawValue,
      correctedValue: correctedValue,
      trend: _trendFor(correctedValue),
      abnormalTier: _tierFor(correctedValue),
      testMethod: request.testMethod,
      testedAt: request.testedAt,
    );
    _inrRecords.insert(0, record);
    return record;
  }

  @override
  Future<UserSettings> fetchSettings() async => const UserSettings(
        targetInrMin: 1.8,
        targetInrMax: 2.5,
        defaultMedicationTime: '20:00',
        testCycle: TestCycle(unit: TestCycleUnit.week, interval: 1),
        testMethods: ['hospital_lab', 'poct_device', 'home_device'],
        inrOffset: 0,
      );

  @override
  Future<UserSettings> updateSettings(UserSettings settings) async => settings;

  static List<InrRecord> _seedInrRecords() {
    final now = DateTime.now();
    return [
      InrRecord(id: 'demo-3', rawValue: 2.2, correctedValue: 2.2, trend: InrTrend.inRange, abnormalTier: AbnormalTier.normal, testMethod: TestMethod.hospitalLab, testedAt: now.subtract(const Duration(days: 1))),
      InrRecord(id: 'demo-2', rawValue: 1.7, correctedValue: 1.8, trend: InrTrend.inRange, abnormalTier: AbnormalTier.normal, testMethod: TestMethod.poctDevice, testedAt: now.subtract(const Duration(days: 8))),
      InrRecord(id: 'demo-1', rawValue: 2.8, correctedValue: 2.7, trend: InrTrend.high, abnormalTier: AbnormalTier.strongHigh, testMethod: TestMethod.homeDevice, testedAt: now.subtract(const Duration(days: 15))),
    ];
  }

  static AbnormalTier _tierFor(double value) {
    if (value < 1.7) return AbnormalTier.strongLow;
    if (value < 1.8) return AbnormalTier.weakLow;
    if (value > 2.6) return AbnormalTier.strongHigh;
    if (value > 2.5) return AbnormalTier.weakHigh;
    return AbnormalTier.normal;
  }

  static InrTrend _trendFor(double value) {
    if (value < 1.8) return InrTrend.low;
    if (value > 2.5) return InrTrend.high;
    return InrTrend.inRange;
  }

  static double _roundInr(double value) => (value * 100).round() / 100;
}

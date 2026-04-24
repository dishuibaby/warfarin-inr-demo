enum AbnormalTier { normal, weakLow, weakHigh, strongLow, strongHigh }
enum InrTrend { low, inRange, high }
enum TestMethod { hospitalLab, poctDevice, homeDevice, other }

const _abnormalTierWireNames = {
  AbnormalTier.normal: 'normal',
  AbnormalTier.weakLow: 'weak_low',
  AbnormalTier.weakHigh: 'weak_high',
  AbnormalTier.strongLow: 'strong_low',
  AbnormalTier.strongHigh: 'strong_high',
};

const _testMethodWireNames = {
  TestMethod.hospitalLab: 'hospital_lab',
  TestMethod.poctDevice: 'poct_device',
  TestMethod.homeDevice: 'home_device',
  TestMethod.other: 'other',
};

const _inrTrendWireNames = {
  InrTrend.low: 'low',
  InrTrend.inRange: 'in_range',
  InrTrend.high: 'high',
};

T _enumFromWire<T extends Enum>(Map<T, String> names, String? value, T fallback) {
  for (final entry in names.entries) {
    if (entry.value == value) return entry.key;
  }
  return fallback;
}

class InrRecord {
  const InrRecord({
    required this.id,
    required this.rawValue,
    required this.correctedValue,
    required this.trend,
    required this.abnormalTier,
    required this.testMethod,
    required this.testedAt,
  });

  factory InrRecord.fromJson(Map<String, dynamic> json) {
    return InrRecord(
      id: json['id'] as String? ?? '',
      rawValue: (json['rawValue'] as num? ?? 0).toDouble(),
      correctedValue: (json['correctedValue'] as num? ?? 0).toDouble(),
      trend: _enumFromWire(_inrTrendWireNames, json['trend'] as String?, InrTrend.inRange),
      abnormalTier: _enumFromWire(_abnormalTierWireNames, json['abnormalTier'] as String?, AbnormalTier.normal),
      testMethod: _enumFromWire(_testMethodWireNames, json['testMethod'] as String?, TestMethod.other),
      testedAt: DateTime.tryParse(json['testedAt'] as String? ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  final String id;
  final double rawValue;
  final double correctedValue;
  final InrTrend trend;
  final AbnormalTier abnormalTier;
  final TestMethod testMethod;
  final DateTime testedAt;
}

class CreateInrRecordRequest {
  const CreateInrRecordRequest({
    required this.rawValue,
    required this.testMethod,
    required this.testedAt,
    this.offset,
  });

  final double rawValue;
  final double? offset;
  final TestMethod testMethod;
  final DateTime testedAt;

  Map<String, dynamic> toJson() => {
        'rawValue': rawValue,
        if (offset != null) 'offset': offset,
        'testMethod': _testMethodWireNames[testMethod],
        'testedAt': testedAt.toUtc().toIso8601String(),
      };
}

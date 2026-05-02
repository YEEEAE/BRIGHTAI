(function () {
  const wards = ["باطنية", "جراحة", "عناية", "ولادة", "أطفال"];
  const floors = ["الأول", "الثاني", "الثالث", "الرابع"];
  const baseSeed = {
    occupancy: 84,
    erWait: 42,
    staffGaps: 6,
    supplyCritical: 4,
    alos: 4.9,
    readmission: 7.8,
    mortality: 0.91,
    satisfaction: 82
  };

  const scenarios = [
    {
      id: "hajj_surge",
      title: "موسم حج: ضاعف الإسعاف وادرس التأثير",
      summary: "زيادة استقبال الإسعاف 100% خلال 6 ساعات مع ضغط على العناية والطوارئ.",
      question: "ما أثر مضاعفة استقبال الإسعاف خلال موسم الحج على إشغال الأسرة والكادر؟",
      timeline: [
        "الدقيقة 0: ارتفاع البلاغات القادمة من الإسعاف بنسبة 100%.",
        "الدقيقة 8: تحويل 12 حالة فرز أصفر إلى مسار سريع لتخفيف الانتظار.",
        "الدقيقة 16: نقل فريق تمريض من العيادات إلى الطوارئ مع مراقبة نقص التغطية.",
        "الدقيقة 24: حجز 10 أسرّة عناية انتقالية وتقليل العمليات غير العاجلة.",
        "الدقيقة 30: توصية تشغيلية تتطلب اعتماد المدير المناوب وقائد الطوارئ."
      ],
      adjustments: { occupancy: 9, erWait: 28, staffGaps: 4, supplyCritical: 1 }
    },
    {
      id: "flu_wave",
      title: "أوبئة موسمية: ارتفاع 40% في حالات الإنفلونزا",
      summary: "تدفق حالات تنفسية يضغط العيادات والطوارئ ويزيد مخاطر العدوى الداخلية.",
      question: "كيف نعيد توزيع المسارات عند ارتفاع حالات الإنفلونزا بنسبة 40%؟",
      timeline: [
        "الدقيقة 0: ارتفاع التسجيل في العيادات التنفسية بنسبة 40%.",
        "الدقيقة 7: فتح مسار فرز تنفسي مستقل قبل منطقة الانتظار العامة.",
        "الدقيقة 14: رفع مخزون الكمامات ومضادات الفيروسات وفق حد إعادة الطلب.",
        "الدقيقة 22: جدولة كوادر مكافحة العدوى على ساعات الذروة.",
        "الدقيقة 30: تقرير فجوات للوقاية ومؤشرات انتظار الطوارئ."
      ],
      adjustments: { occupancy: 5, erWait: 19, staffGaps: 2, supplyCritical: 3 }
    },
    {
      id: "nursing_shortage",
      title: "نقص كادر تمريض: غياب 15% — كيف نوزع؟",
      summary: "غياب مفاجئ في الوردية المسائية يهدد العناية والباطنية والفرز.",
      question: "اقترح إعادة توزيع الكوادر عند غياب 15% من التمريض في الوردية المسائية.",
      timeline: [
        "الدقيقة 0: تأكيد غياب 15% من تمريض الوردية المسائية.",
        "الدقيقة 6: تحديد الأقسام ذات الخطورة الأعلى حسب نسبة المرضى إلى الممرضين.",
        "الدقيقة 13: نقل مؤقت من العيادات الأقل ضغطاً إلى العناية والفرز.",
        "الدقيقة 21: تقليل نشاطات غير حرجة وتفعيل قائمة الاستدعاء الاحتياطي.",
        "الدقيقة 30: خطة تغطية مع مخاطر إرهاق وساعات إضافية."
      ],
      adjustments: { occupancy: 2, erWait: 11, staffGaps: 9, supplyCritical: 0 }
    },
    {
      id: "cbahi_review",
      title: "مراجعة سباهي قادمة خلال 30 يوم — ما الفجوات؟",
      summary: "فحص جاهزية الجودة والتوثيق وسلامة المرضى قبل زيارة الاعتماد.",
      question: "ما فجوات سباهي المتوقعة خلال 30 يوماً وما أولويات الإغلاق؟",
      timeline: [
        "الدقيقة 0: تحميل قائمة متطلبات الاعتماد التشغيلية.",
        "الدقيقة 5: مقارنة سجلات الحوادث والتدريب وسلامة الدواء.",
        "الدقيقة 12: تحديد فجوات التوثيق ذات الأولوية العالية.",
        "الدقيقة 20: توزيع ملاك الإجراءات ومواعيد الإغلاق.",
        "الدقيقة 30: تقرير جاهزية مختصر لمجلس الجودة."
      ],
      adjustments: { occupancy: 0, erWait: 4, staffGaps: 2, supplyCritical: 2 }
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function jitter(value, spread, tick) {
    const wave = Math.sin((Date.now() / 1000 + tick) / 4) * spread;
    const random = (Math.random() - 0.5) * spread;
    return value + wave + random;
  }

  function createSnapshot(activeScenarioId) {
    const tick = Math.floor(Date.now() / 5000);
    const scenario = scenarios.find((item) => item.id === activeScenarioId) || scenarios[0];
    const adj = scenario.adjustments;
    const occupancy = clamp(Math.round(jitter(baseSeed.occupancy + adj.occupancy, 5, tick)), 62, 99);
    const erWait = clamp(Math.round(jitter(baseSeed.erWait + adj.erWait, 9, tick + 3)), 18, 120);
    const staffGaps = clamp(Math.round(jitter(baseSeed.staffGaps + adj.staffGaps, 2, tick + 7)), 1, 18);
    const supplyCritical = clamp(Math.round(jitter(baseSeed.supplyCritical + adj.supplyCritical, 1.5, tick + 11)), 0, 10);

    return {
      scenario,
      generatedAt: new Date().toISOString(),
      hero: { occupancy, erWait, staffGaps, supplyCritical },
      kpis: [
        { label: "متوسط مدة الإقامة", value: `${(baseSeed.alos + adj.occupancy * 0.03).toFixed(1)} يوم`, trend: "up", delta: "+0.4" },
        { label: "إعادة الإدخال خلال 30 يوم", value: `${(baseSeed.readmission + adj.erWait * 0.03).toFixed(1)}%`, trend: "up", delta: "+0.8%" },
        { label: "مؤشر الوفيات المعدّل", value: (baseSeed.mortality + adj.staffGaps * 0.01).toFixed(2), trend: "flat", delta: "ضمن الحد" },
        { label: "رضا المرضى", value: `${clamp(baseSeed.satisfaction - Math.round(adj.erWait * 0.18), 54, 96)}%`, trend: "down", delta: "-5%" },
        { label: "إشغال الأسرة", value: `${occupancy}%`, trend: occupancy > 90 ? "up" : "flat", delta: "توقع 6 ساعات" },
        { label: "انتظار الطوارئ", value: `${erWait} د`, trend: erWait > 55 ? "up" : "flat", delta: "نافذة ذروة" }
      ],
      beds: floors.flatMap((floor, floorIndex) => wards.map((ward, wardIndex) => {
        const value = clamp(Math.round(occupancy + (floorIndex - 1) * 3 + (wardIndex - 2) * 4 + Math.random() * 8), 45, 100);
        return { floor, ward, value, predicted: clamp(value + Math.round(adj.occupancy * 0.6), 45, 100) };
      })),
      er: [
        { name: "فرز أحمر", current: clamp(erWait - 31, 4, 25), predicted: clamp(erWait - 24, 6, 35), surge: "خطر محدود" },
        { name: "فرز أصفر", current: erWait, predicted: clamp(erWait + 17, 22, 140), surge: "ذروة 18:00 - 21:00" },
        { name: "فرز أخضر", current: clamp(erWait + 28, 34, 160), predicted: clamp(erWait + 43, 45, 190), surge: "قابل للتحويل لمسار سريع" }
      ],
      operations: [
        { id: "or-1", name: "منظار جهاز هضمي", room: "غرفة 2", time: "09:30", conflict: false, utilization: "76%" },
        { id: "or-2", name: "عملية عظام مجدولة", room: "غرفة 4", time: "11:00", conflict: true, utilization: "94%" },
        { id: "or-3", name: "قيصرية عاجلة محتملة", room: "غرفة 1", time: "12:15", conflict: adj.occupancy > 5, utilization: "88%" }
      ],
      roster: [
        { shift: "صباحية", area: "طوارئ", coverage: `${clamp(96 - staffGaps, 72, 99)}%`, gap: false },
        { shift: "مسائية", area: "عناية", coverage: `${clamp(82 - staffGaps * 2, 48, 91)}%`, gap: true },
        { shift: "ليلية", area: "باطنية", coverage: `${clamp(89 - staffGaps, 60, 96)}%`, gap: staffGaps > 8 },
        { shift: "مسائية", area: "مختبر", coverage: "91%", gap: false },
        { shift: "مسائية", area: "فرز", coverage: `${clamp(78 - staffGaps, 50, 88)}%`, gap: true },
        { shift: "ليلية", area: "صيدلية", coverage: "84%", gap: false }
      ],
      supply: [
        { item: "محلول وريدي", status: supplyCritical > 3 ? "نفاد خلال 18 ساعة" : "مستقر 42 ساعة", risk: supplyCritical > 3 ? "high" : "warn" },
        { item: "مضاد حيوي واسع الطيف", status: "دفعة تنتهي خلال 21 يوم", risk: "warn" },
        { item: "كمامات عزل", status: supplyCritical > 5 ? "حد إعادة الطلب مكسور" : "قريب من حد إعادة الطلب", risk: supplyCritical > 5 ? "high" : "warn" },
        { item: "شرائح مختبر", status: "استهلاك أعلى من المتوسط 18%", risk: "warn" }
      ]
    };
  }

  function fallbackRecommendation(snapshot, question) {
    const scenario = snapshot.scenario;
    return {
      decision_summary: `يوصى بتفعيل خطة ${scenario.title} مع إعادة توزيع مرحلية للكادر والأسرة خلال 6 ساعات، لأن إشغال الأسرة وصل ${snapshot.hero.occupancy}% وانتظار الطوارئ ${snapshot.hero.erWait} دقيقة.`,
      recommended_actions: [
        {
          action: "فتح مسار فرز سريع للحالات منخفضة الخطورة وربطه بمؤشر انتظار الطوارئ كل 30 دقيقة",
          impact_estimate: "خفض الانتظار المتوقع 12 إلى 18 دقيقة",
          effort: "متوسط",
          risk: "قد يزيد الضغط على المختبر إذا لم تُحجز طاقة تحليل موازية",
          owner_role: "مدير الطوارئ",
          deadline: "خلال ساعتين"
        },
        {
          action: "نقل تمريض مؤقت من العيادات الأقل ضغطاً إلى العناية والفرز المسائي",
          impact_estimate: "رفع تغطية الوردية الحرجة من 68% إلى 84%",
          effort: "مرتفع",
          risk: "إرهاق الكادر وانخفاض رضا العيادات إذا طال النقل أكثر من وردية",
          owner_role: "مدير التمريض",
          deadline: "قبل بداية الوردية المسائية"
        },
        {
          action: "تأجيل العمليات غير العاجلة ذات التعارض العالي وتحرير سريرين عناية انتقالية",
          impact_estimate: "تقليل تعارض غرف العمليات 20% ورفع مرونة الأسرة الحرجة",
          effort: "متوسط",
          risk: "يتطلب موافقة الطبيب المعالج ومراجعة أولوية الحالات",
          owner_role: "مدير العمليات الجراحية",
          deadline: "خلال 4 ساعات"
        }
      ],
      trade_offs: [
        { benefit: "تخفيف ضغط الطوارئ سريعاً", cost: "تأثير محدود على مواعيد العيادات غير العاجلة" },
        { benefit: "تحسين جاهزية الاعتماد والتدقيق", cost: "زيادة عبء التوثيق على قادة الورديات" }
      ],
      affected_kpis: [
        { kpi: "إشغال الأسرة", current: `${snapshot.hero.occupancy}%`, projected: `${Math.max(76, snapshot.hero.occupancy - 6)}%`, delta: "-6%" },
        { kpi: "انتظار الطوارئ", current: `${snapshot.hero.erWait} دقيقة`, projected: `${Math.max(18, snapshot.hero.erWait - 15)} دقيقة`, delta: "-15 دقيقة" },
        { kpi: "رضا المرضى", current: snapshot.kpis[3].value, projected: `${Math.min(92, Number.parseInt(snapshot.kpis[3].value, 10) + 4)}%`, delta: "+4%" }
      ],
      compliance_notes: [
        { standard: "CBAHI", clause: "إدارة تدفق المرضى وسلامة التحويل", status: "يتطلب توثيق قرار المناوبة" },
        { standard: "JCI", clause: "تحسين الجودة وسلامة المرضى", status: "مقبول إذا تم اعتماد المخاطر" },
        { standard: "PDPL", clause: "تقليل البيانات ومعالجة الغرض", status: "لا تستخدم بيانات شخصية في الديمو" }
      ],
      human_approval_required: true
    };
  }

  window.HospitalSyntheticData = {
    scenarios,
    createSnapshot,
    fallbackRecommendation
  };
})();

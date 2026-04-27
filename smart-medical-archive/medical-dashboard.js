function rt(e2) {
  return `${e2.getFullYear()}-${String(e2.getMonth() + 1).padStart(2, "0")}-${String(e2.getDate()).padStart(2, "0")}`;
}
function at(e2, t2) {
  const n2 = Object.assign({ type: String(e2 || "event"), ts: Date.now(), actor: R.leadName && R.leadName.value.trim() || "مستخدم النظام" }, t2 || {});
  j.dashboardEvents.push(n2), j.dashboardEvents.length > 1e3 && (j.dashboardEvents = j.dashboardEvents.slice(-1e3)), F(f, JSON.stringify(j.dashboardEvents.slice(-300))), bt("تم تسجيل نشاط جديد في النظام.");
}
function ot(e2) {
  const t2 = Be(e2 && (e2.savedAt || e2.capturedAt || e2.encounter && e2.encounter.date) || "");
  return null != t2 ? t2 : Date.now();
}
function it(e2, t2, n2) {
  if (!t2 || !window.Chart) return null;
  const r2 = j.dashboardCharts[e2];
  r2 && "function" == typeof r2.destroy && r2.destroy();
  const a2 = new window.Chart(t2.getContext("2d"), n2);
  return j.dashboardCharts[e2] = a2, a2;
}
function st() {
  const e2 = R.timelineGranularitySelect ? R.timelineGranularitySelect.value : "daily", t2 = function(e3, t3) {
    const n3 = {};
    return e3.slice().sort(function(e4, t4) {
      return ot(e4) - ot(t4);
    }).forEach(function(e4) {
      const r3 = new Date(ot(e4));
      let a3 = "";
      if ("monthly" === t3) a3 = `${r3.getFullYear()}-${String(r3.getMonth() + 1).padStart(2, "0")}`;
      else if ("weekly" === t3) {
        const e5 = new Date(r3);
        e5.setDate(r3.getDate() - r3.getDay()), a3 = `أسبوع ${rt(e5)}`;
      } else a3 = rt(r3);
      n3[a3] || (n3[a3] = []), n3[a3].push(e4);
    }), n3;
  }(j.records, e2), n2 = Object.keys(t2).sort(), r2 = n2.map(function(e3) {
    return t2[e3].length;
  }), a2 = {};
  j.records.forEach(function(t3) {
    const n3 = Ce(t3) || "غير محدد";
    a2[n3] || (a2[n3] = {});
    const r3 = new Date(ot(t3));
    let o3 = "monthly" === e2 ? `${r3.getFullYear()}-${String(r3.getMonth() + 1).padStart(2, "0")}` : "weekly" === e2 ? `أسبوع ${rt(new Date(r3.getFullYear(), r3.getMonth(), r3.getDate() - r3.getDay()))}` : rt(r3);
    a2[n3][o3] = (a2[n3][o3] || 0) + 1;
  });
  const o2 = Object.keys(a2).slice(0, 3).map(function(e3, t3) {
    const r3 = ["#19b2a4", "#ff8a34", "#5aa3ff"];
    return { label: e3, data: n2.map(function(t4) {
      return a2[e3][t4] || 0;
    }), borderColor: r3[t3 % r3.length], backgroundColor: "transparent", tension: 0.3 };
  });
  o2.unshift({ label: "إجمالي السجلات", data: r2, borderColor: "#e8f1f8", backgroundColor: "rgba(232,241,248,0.15)", tension: 0.3, fill: true }), it("timelineChart", R.timelineChart, { type: "line", data: { labels: n2, datasets: o2 }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#c9d8e4" } }, zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }, pan: { enabled: true, mode: "x" } } }, scales: { x: { ticks: { color: "#a8bfce" }, grid: { color: "rgba(166,197,221,0.1)" } }, y: { ticks: { color: "#a8bfce" }, grid: { color: "rgba(166,197,221,0.1)" }, beginAtZero: true } } } });
}
function ct() {
  const e2 = {};
  j.records.forEach(function(t3) {
    me(t3.medications).forEach(function(t4) {
      const n3 = t4.name || "غير محدد";
      e2[n3] = (e2[n3] || 0) + 1;
    });
  });
  const t2 = Object.keys(e2).map(function(t3) {
    return { name: t3, count: e2[t3] };
  }).sort(function(e3, t3) {
    return t3.count - e3.count;
  }).slice(0, 10);
  it("topMedicationsChart", R.topMedicationsChart, { type: "bar", data: { labels: t2.map(function(e3) {
    return e3.name;
  }), datasets: [{ label: "عدد الوصفات", data: t2.map(function(e3) {
    return e3.count;
  }), backgroundColor: "#5aa3ff" }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } }), R.medicationListInteractive && (R.medicationListInteractive.innerHTML = t2.length ? t2.map(function(e3) {
    return `<div class="record-item"><strong>${_(e3.name)}</strong><div class="meta">عدد الوصفات: ${_(String(e3.count))}</div></div>`;
  }).join("") : '<p class="meta">لا توجد بيانات أدوية كافية.</p>');
  const n2 = function(e3) {
    const t3 = [{ a: "warfarin", b: "tamoxifen", level: "high", note: "قد يزيد خطر النزف" }, { a: "insulin", b: "metformin", level: "medium", note: "راقب هبوط السكر مع تعديل الجرعات" }, { a: "aspirin", b: "clopidogrel", level: "medium", note: "مضاعفة تأثير مميعات الدم" }, { a: "furosemide", b: "digoxin", level: "high", note: "احتمال اضطراب النظم مع نقص البوتاسيوم" }], n3 = [];
    return e3.forEach(function(e4) {
      const r2 = me(e4.medications).map(function(e5) {
        return Ee(e5.name);
      });
      t3.forEach(function(t4) {
        r2.some(function(e5) {
          return e5.includes(t4.a);
        }) && r2.some(function(e5) {
          return e5.includes(t4.b);
        }) && n3.push({ recordId: e4.recordId || "rec", level: t4.level, note: t4.note, pair: `${t4.a} + ${t4.b}` });
      });
    }), n3;
  }(j.records);
  R.drugInteractionList && (R.drugInteractionList.innerHTML = n2.length ? n2.slice(0, 10).map(function(e3) {
    return `<div class="record-item"><strong>${_(e3.level.toUpperCase())}</strong><div class="meta">${_(e3.pair)} - ${_(e3.note)} - ${_(e3.recordId)}</div></div>`;
  }).join("") : '<p class="meta">لم يتم رصد تفاعلات دوائية بارزة في البيانات الحالية.</p>');
}
function ut() {
  R.liveNotificationsList && (R.liveNotificationsList.innerHTML = j.dashboardNotifications.length ? j.dashboardNotifications.slice().reverse().slice(0, 18).map(function(e2) {
    return `<div class="record-item"><div class="top"><span class="id">${_(e2.level || "live")}</span><span class="meta">${_(new Date(e2.ts).toLocaleTimeString("ar-SA"))}</span></div><div class="meta">${_(e2.message || "")}</div></div>`;
  }).join("") : '<p class="meta">لا توجد إشعارات حية حتى الآن.</p>');
}
function lt(e2, t2) {
  j.dashboardNotifications.push({ level: e2, message: t2, ts: Date.now() }), j.dashboardNotifications.length > 100 && (j.dashboardNotifications = j.dashboardNotifications.slice(-100)), ut();
}
function dt(e2, t2) {
  Z(R.liveSocketStatus, e2, t2);
}
function gt() {
  if (j.liveSocketRetryTimer && (clearTimeout(j.liveSocketRetryTimer), j.liveSocketRetryTimer = null), j.liveSocket) {
    try {
      j.liveSocket.close();
    } catch (e2) {
    }
    j.liveSocket = null;
  }
  j.liveSocketConnected = false;
}
function mt(e2) {
  if (e2 && gt(), j.liveSocketConnected || j.liveSocket) return;
  const t2 = q().map(function(e3) {
    const t3 = String(e3 || "").replace(/\/+$/, "");
    return t3.startsWith("https://") ? t3.replace(/^https:\/\//, "wss://") : t3.startsWith("http://") ? t3.replace(/^http:\/\//, "ws://") : t3;
  });
  let n2 = 0;
  const r2 = function() {
    if (n2 >= t2.length) return dt("تعذر الاتصال بـ WebSocket حالياً، سيتم إعادة المحاولة تلقائياً.", "error"), void (j.liveSocketRetryTimer = setTimeout(function() {
      j.liveSocketRetryTimer = null, mt(true);
    }, 6e3));
    const e3 = t2[n2];
    n2 += 1;
    const a2 = `${e3}/ws/live`;
    let o2;
    try {
      o2 = new WebSocket(a2);
    } catch (e4) {
      return void r2();
    }
    let i2 = false;
    const s2 = setTimeout(function() {
      if (!i2) {
        try {
          o2.close();
        } catch (e4) {
        }
        r2();
      }
    }, 3500);
    o2.onopen = function() {
      i2 = true, clearTimeout(s2), j.liveSocket = o2, j.liveSocketConnected = true, dt(`متصل بالتحديثات الفورية عبر WebSocket: ${a2}`, "success");
    }, o2.onmessage = function(e4) {
      try {
        const t3 = JSON.parse(e4.data || "{}"), n3 = t3.level || t3.type || "live";
        lt(n3, t3.message || "تحديث فوري جديد."), "metrics_update" === t3.type && at("live_metrics", { success: true, source: "ws" });
      } catch (e5) {
        lt("live", "تم استلام تحديث فوري جديد.");
      }
    }, o2.onerror = function() {
      clearTimeout(s2);
    }, o2.onclose = function() {
      clearTimeout(s2), j.liveSocketConnected = false, j.liveSocket = null, dt("انقطع اتصال WebSocket. إعادة الاتصال جارية...", "error"), j.liveSocketRetryTimer = setTimeout(function() {
        j.liveSocketRetryTimer = null, mt(true);
      }, 5e3);
    };
  };
  dt("جاري محاولة الاتصال بالتحديثات الفورية...", ""), r2();
}
function pt(e2, t2) {
  Z(R.dashboardStatus, e2, t2);
}
function ht() {
  if (!R.dashboardWidgets) return;
  Array.from(R.dashboardWidgets.querySelectorAll("[data-widget-id]")).forEach(function(e2) {
    const t2 = e2.getAttribute("data-widget-id");
    e2.style.display = j.dashboardHiddenWidgets.has(t2) ? "none" : "";
  }), R.widgetToggles && R.widgetToggles.length && R.widgetToggles.forEach(function(e2) {
    const t2 = e2.getAttribute("data-widget-toggle");
    e2.checked = !j.dashboardHiddenWidgets.has(t2);
  });
}
function ft() {
  R.dashboardWidgets && j.dashboardWidgetOrder.forEach(function(e2) {
    const t2 = R.dashboardWidgets.querySelector(`[data-widget-id="${e2}"]`);
    t2 && R.dashboardWidgets.appendChild(t2);
  });
}
function vt() {
  const e2 = { order: j.dashboardWidgetOrder.slice(), hidden: Array.from(j.dashboardHiddenWidgets) };
  F(m, JSON.stringify(e2)), F(p, j.dashboardRole || "director");
}
function yt(e2, t2) {
  e2 && (t2 ? j.dashboardHiddenWidgets.delete(e2) : j.dashboardHiddenWidgets.add(e2), ht(), vt(), bt("تم تحديث عرض الودجت."));
}
function St() {
  j.dashboardWidgetOrder = B.slice(), j.dashboardHiddenWidgets = /* @__PURE__ */ new Set(), ft(), ht(), vt(), bt("تمت إعادة تعيين التخطيط الافتراضي.");
}
function Et() {
  if (!R.dashboardWidgets) return;
  const e2 = Array.from(R.dashboardWidgets.querySelectorAll("[data-widget-id]")).map(function(e3) {
    return e3.getAttribute("data-widget-id");
  }).filter(Boolean);
  e2.length && (j.dashboardWidgetOrder = e2);
}
function wt() {
  const e2 = function() {
    const e3 = Date.now(), t2 = 864e5, n2 = 7 * t2, r2 = j.records.length, a2 = j.records.filter(function(n3) {
      return e3 - ot(n3) <= t2;
    }).length, o2 = j.records.filter(function(t3) {
      return e3 - ot(t3) <= n2;
    }).length, i2 = j.records.filter(function(e4) {
      return ge(e4.alerts).some(function(e5) {
        const t3 = Ee(e5);
        return t3.includes("خطر") || t3.includes("critical") || t3.includes("high");
      });
    }).length, s2 = j.dashboardEvents.filter(function(n3) {
      return e3 - n3.ts <= t2;
    }).length, c2 = j.dashboardEvents.filter(function(e4) {
      return null != e4.durationMs && Number(e4.durationMs) > 0;
    }).map(function(e4) {
      return Number(e4.durationMs);
    }), u2 = c2.length ? Math.round(c2.reduce(function(e4, t3) {
      return e4 + t3;
    }, 0) / c2.length) : 0, l2 = u2 ? (u2 / 1e3).toFixed(1) : "0.0", d2 = j.records.map(function(e4) {
      return Number(e4 && e4.confidence);
    }).filter(function(e4) {
      return Number.isFinite(e4) && e4 > 0;
    }), g2 = d2.length ? Math.round(d2.reduce(function(e4, t3) {
      return e4 + t3;
    }, 0) / d2.length * 100) : 90, m2 = j.dashboardEvents.filter(function(e4) {
      return "analysis" === e4.type;
    }), p2 = m2.filter(function(e4) {
      return !!e4.success;
    }), h2 = m2.length ? Math.round(p2.length / m2.length * 100) : r2 ? 95 : 0, f2 = Math.min(35, Math.round(u2 / 80)), v2 = Math.max(50, Math.min(99, Math.round(0.55 * h2 + 0.35 * g2 + 0.1 * (100 - f2)))), y2 = j.dashboardHistory.length ? j.dashboardHistory[j.dashboardHistory.length - 1] : null;
    return { totalRecords: r2, growth: y2 && y2.totalRecords ? Math.round((r2 - y2.totalRecords) / y2.totalRecords * 100) : r2 ? 100 : 0, newToday: a2, newWeek: o2, criticalCases: i2, dailyUsage: s2, avgProcessingSec: l2, responseMs: u2, accuracy: g2, successRate: h2, satisfaction: v2 };
  }();
  !function(e3) {
    R.overviewTotalRecords && (R.overviewTotalRecords.textContent = String(e3.totalRecords)), R.overviewTotalGrowth && (R.overviewTotalGrowth.textContent = `${e3.growth >= 0 ? "+" : ""}${e3.growth}%`), R.overviewNewRecords && (R.overviewNewRecords.textContent = `${e3.newToday} / ${e3.newWeek}`), R.overviewCriticalCases && (R.overviewCriticalCases.textContent = String(e3.criticalCases)), R.overviewDailyUsage && (R.overviewDailyUsage.textContent = String(e3.dailyUsage)), R.overviewAvgProcessing && (R.overviewAvgProcessing.textContent = `${e3.avgProcessingSec}ث`), R.kpiResponseTime && (R.kpiResponseTime.textContent = `${e3.responseMs}ms`), R.kpiExtractionAccuracy && (R.kpiExtractionAccuracy.textContent = `${e3.accuracy}%`), R.kpiAnalysisSuccess && (R.kpiAnalysisSuccess.textContent = `${e3.successRate}%`), R.kpiUserSatisfaction && (R.kpiUserSatisfaction.textContent = `${e3.satisfaction}%`);
  }(e2), function(e3) {
    const t2 = rt(/* @__PURE__ */ new Date()), n2 = j.dashboardHistory.findIndex(function(e4) {
      return e4.dateKey === t2;
    }), r2 = { dateKey: t2, ts: Date.now(), totalRecords: e3.totalRecords, criticalCases: e3.criticalCases, dailyUsage: e3.dailyUsage, avgProcessingSec: e3.avgProcessingSec, responseMs: e3.responseMs, accuracy: e3.accuracy, successRate: e3.successRate, satisfaction: e3.satisfaction };
    n2 >= 0 ? j.dashboardHistory[n2] = r2 : j.dashboardHistory.push(r2), j.dashboardHistory = j.dashboardHistory.slice(-180), F(h, JSON.stringify(j.dashboardHistory));
  }(e2), st(), function() {
    const e3 = { "0-17": 0, "18-35": 0, "36-60": 0, "60+": 0, "غير محدد": 0 }, t2 = { "ذكر": 0, "أنثى": 0, "غير محدد": 0 }, n2 = {};
    j.records.forEach(function(r3) {
      const a3 = r3 && r3.patient ? r3.patient : {}, o2 = be(a3.age);
      null == o2 ? e3["غير محدد"] += 1 : o2 < 18 ? e3["0-17"] += 1 : o2 <= 35 ? e3["18-35"] += 1 : o2 <= 60 ? e3["36-60"] += 1 : e3["60+"] += 1;
      const i2 = Me(a3.gender);
      "male" === i2 ? t2["ذكر"] += 1 : "female" === i2 ? t2["أنثى"] += 1 : t2["غير محدد"] += 1;
      const s2 = function(e4) {
        return e4 && e4.patient && e4.patient.city || e4 && e4.sourceHospital || "غير محدد";
      }(r3);
      n2[s2] = (n2[s2] || 0) + 1;
    }), it("ageDistributionChart", R.ageDistributionChart, { type: "pie", data: { labels: Object.keys(e3), datasets: [{ data: Object.values(e3), backgroundColor: ["#19b2a4", "#5aa3ff", "#ff8a34", "#e35d75", "#7f8fa6"] }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } } } }), it("genderDistributionChart", R.genderDistributionChart, { type: "bar", data: { labels: Object.keys(t2), datasets: [{ label: "عدد الحالات", data: Object.values(t2), backgroundColor: ["#5aa3ff", "#ff8a34", "#7f8fa6"] }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } });
    const r2 = Object.keys(n2).map(function(e4) {
      return { city: e4, value: n2[e4] };
    }).sort(function(e4, t3) {
      return t3.value - e4.value;
    }).slice(0, 12), a2 = r2.length ? r2[0].value : 1;
    it("geoHeatmapChart", R.geoHeatmapChart, { type: "bar", data: { labels: r2.map(function(e4) {
      return e4.city;
    }), datasets: [{ label: "الكثافة الجغرافية", data: r2.map(function(e4) {
      return e4.value;
    }), backgroundColor: r2.map(function(e4) {
      return `rgba(25,178,164,${0.3 + 0.7 * (a2 ? e4.value / a2 : 0)})`;
    }) }] }, options: { indexAxis: "y", plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" }, beginAtZero: true }, y: { ticks: { color: "#cfe0ec" } } } } });
  }(), function() {
    const e3 = {};
    j.records.forEach(function(t3) {
      ge(t3.diagnoses).forEach(function(t4) {
        const n3 = t4 || "غير محدد";
        e3[n3] = (e3[n3] || 0) + 1;
      });
    });
    const t2 = Object.keys(e3).map(function(t3) {
      return { name: t3, count: e3[t3] };
    }).sort(function(e4, t3) {
      return t3.count - e4.count;
    }).slice(0, 10), n2 = Math.max(1, Math.floor(j.records.length / 2)), r2 = j.records.slice(0, n2), a2 = {};
    r2.forEach(function(e4) {
      ge(e4.diagnoses).forEach(function(e5) {
        const t3 = e5 || "غير محدد";
        a2[t3] = (a2[t3] || 0) + 1;
      });
    }), it("topDiagnosesChart", R.topDiagnosesChart, { type: "bar", data: { labels: t2.map(function(e4) {
      return e4.name;
    }), datasets: [{ label: "الفترة الحالية", data: t2.map(function(e4) {
      return e4.count;
    }), backgroundColor: "#19b2a4" }, { label: "الفترة السابقة", data: t2.map(function(e4) {
      return a2[e4.name] || 0;
    }), backgroundColor: "#ff8a34" }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } });
  }(), ct(), function() {
    const e3 = {}, t2 = Array.from({ length: 24 }, function() {
      return 0;
    }), n2 = {};
    j.dashboardEvents.forEach(function(r3) {
      const a3 = r3.actor || "مستخدم النظام";
      e3[a3] = (e3[a3] || 0) + 1;
      const o3 = new Date(r3.ts || Date.now());
      t2[o3.getHours()] += 1;
      const i2 = rt(o3);
      n2[i2] = (n2[i2] || 0) + 1;
    });
    const r2 = Object.keys(e3).map(function(t3) {
      return { name: t3, count: e3[t3] };
    }).sort(function(e4, t3) {
      return t3.count - e4.count;
    }).slice(0, 8), a2 = Object.keys(n2).sort().slice(-14), o2 = a2.map(function(e4) {
      return n2[e4] || 0;
    });
    it("userActivityChart", R.userActivityChart, { type: "bar", data: { labels: r2.map(function(e4) {
      return e4.name;
    }), datasets: [{ label: "عدد العمليات", data: r2.map(function(e4) {
      return e4.count;
    }), backgroundColor: "#19b2a4" }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } }), it("peakHoursChart", R.peakHoursChart, { type: "line", data: { labels: t2.map(function(e4, t3) {
      return `${t3}:00`;
    }), datasets: [{ label: "أوقات الذروة", data: t2, borderColor: "#ff8a34", backgroundColor: "rgba(255,138,52,0.2)", tension: 0.3, fill: true }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } }), it("productivityChart", R.productivityChart, { type: "bar", data: { labels: a2, datasets: [{ label: "إنتاجية الاستخدام اليومية", data: o2, backgroundColor: "#5aa3ff" }] }, options: { plugins: { legend: { labels: { color: "#cfe0ec" } } }, scales: { x: { ticks: { color: "#cfe0ec" } }, y: { ticks: { color: "#cfe0ec" }, beginAtZero: true } } } });
  }(), function() {
    const e3 = [], t2 = [], n2 = [], r2 = [];
    j.records.forEach(function(a3) {
      const o3 = a3 && a3.patient && a3.patient.name || "مريض غير معروف", i3 = a3.recordId || "rec";
      ge(a3.alerts).forEach(function(t3) {
        const n3 = Ee(t3);
        (n3.includes("خطر") || n3.includes("critical") || n3.includes("high")) && e3.push(`${i3} - ${o3}: ${t3}`);
      }), me(a3.medications).forEach(function(e4) {
        const n3 = String(e4.duration || "").match(/(\d+)/), r3 = n3 ? Number(n3[1]) : null;
        null != r3 && r3 <= 7 && t2.push(`${i3} - ${e4.name}: المدة المتبقية قصيرة (${r3} أيام)`);
      });
      const s2 = a3.summary && "object" == typeof a3.summary ? a3.summary : {};
      s2.nextStep && Ee(s2.nextStep).includes("متاب") && n2.push(`${i3} - ${o3}: ${s2.nextStep}`);
      const c2 = ge(a3.alerts).length;
      c2 >= 4 && r2.push(`${i3} - ${o3}: عدد تنبيهات غير اعتيادي (${c2})`);
    });
    const a2 = {};
    j.records.forEach(function(e4) {
      const t3 = rt(new Date(ot(e4)));
      a2[t3] = (a2[t3] || 0) + 1;
    });
    const o2 = Object.values(a2);
    if (o2.length >= 5) {
      const e4 = o2.reduce(function(e5, t4) {
        return e5 + t4;
      }, 0) / o2.length, t3 = o2.reduce(function(t4, n4) {
        return t4 + Math.pow(n4 - e4, 2);
      }, 0) / o2.length, n3 = Math.sqrt(t3);
      Object.keys(a2).forEach(function(t4) {
        n3 > 0 && (a2[t4] - e4) / n3 > 2 && r2.push(`ارتفاع غير طبيعي في عدد السجلات بتاريخ ${t4}`);
      });
    }
    const i2 = function(e4, t3, n3) {
      e4 && (e4.innerHTML = t3.length ? t3.slice(0, 8).map(function(e5) {
        return `<div class="record-item"><div class="meta">${_(e5)}</div></div>`;
      }).join("") : `<p class="meta">${_(n3)}</p>`);
    };
    i2(R.urgentAlertsList, e3, "لا توجد حالات عاجلة حالياً."), i2(R.medExpiryAlertsList, t2, "لا توجد أدوية قريبة الانتهاء."), i2(R.followupAlertsList, n2, "لا توجد مواعيد متابعة قادمة."), i2(R.anomalyAlertsList, r2, "لم يتم رصد حالات شاذة حالياً.");
  }(), ut(), pt(`تم تحديث لوحة التحكم بنجاح. إجمالي السجلات: ${e2.totalRecords} | الحالات الحرجة: ${e2.criticalCases} | متوسط الاستجابة: ${e2.responseMs}ms`, "success");
}
function bt(e2) {
  j.dashboardRefreshTimer || (j.dashboardRefreshTimer = setTimeout(function() {
    j.dashboardRefreshTimer = null, wt(), e2 && pt(e2, "success");
  }, 180));
}
async function Bt() {
  if (j.records.length) {
    X(R.insightsBtn, true, "جاري توليد التحليلات..."), Z(R.insightsStatus, "يجري تحليل الاتجاهات الطبية والتشغيلية...", "");
    try {
      let e2;
      try {
        e2 = await ce({ action: "insights", records: j.records, hospitalProfile: ee() });
      } catch (t2) {
        if (!Q()) throw t2;
        Z(R.insightsStatus, "الخادم غير متاح، يتم عرض تحليل ديمو بدون كشف مفاتيح Gemini.", ""), e2 = await async function(e3) {
          var t3 = K();
          if (!t3.key) throw new Error("Backend Gemini غير متوفر لتوليد التحليلات.");
          var n2 = e3 && e3.records ? e3.records : [], r2 = e3 && e3.hospitalProfile ? e3.hospitalProfile : {}, a2 = n2.slice(0, 30).map(function(e4) {
            return { recordId: e4.recordId, patient: e4.patient, diagnoses: e4.diagnoses, medications: e4.medications, severity: e4.severity, alerts: e4.alerts, hospital_department: e4.hospital_department };
          }), o2 = await D(S, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t3.key }, body: JSON.stringify({ model: t3.model, messages: [{ role: "system", content: "أنت محلل بيانات طبية ذكي متخصص بالمستشفيات السعودية.\nحلل السجلات الطبية المقدمة وأنتج تقريراً تشغيلياً يتضمن:\n1. مؤشرات المخاطر الرئيسية\n2. أنماط التشخيصات والأدوية الشائعة\n3. توصيات تنفيذية للإدارة الطبية\n4. نقاط تحسين تشغيلية قابلة للقياس\nاستخدم لغة عربية مهنية واضحة." }, { role: "user", content: "السجلات (" + n2.length + " سجل):\n" + JSON.stringify(a2, null, 1) + "\n\nالمنشأة: " + (r2.hospitalName || "غير محدد") }], temperature: 0.3, max_tokens: 4096 }) }, w);
          if (!o2.ok) {
            var i2 = {};
            try {
              i2 = await o2.json();
            } catch (e4) {
            }
            var s2 = i2 && i2.error && i2.error.message || "";
            if (401 === o2.status) throw new Error("اعتماد Backend Gemini غير صالح.");
            if (429 === o2.status) throw new Error("تم تجاوز حد الطلبات. انتظر قليلاً.");
            throw new Error(s2 || "خطأ من Gemini API (" + o2.status + ")");
          }
          var c2 = await o2.json();
          if (!c2 || !c2.choices || !c2.choices.length) throw new Error("استجابة فارغة من محرك التحليلات.");
          return { result: c2.choices[0].message.content || "", model: c2.model || t3.model, usage: c2.usage || null };
        }({ records: j.records, hospitalProfile: ee() });
      }
      !function(e3) {
        if (!R.insightsResult) return;
        if (!e3 || "object" != typeof e3) return void (R.insightsResult.innerHTML = "<p>لا توجد تحليلات حالياً.</p>");
        const t2 = e3.kpis && "object" == typeof e3.kpis ? e3.kpis : {}, n2 = J(e3.alerts), r2 = J(e3.recommendations), a2 = n2.length ? n2.slice(0, 6).map(function(e4) {
          const t3 = e4 && "object" == typeof e4 ? e4.level : "", n3 = e4 && "object" == typeof e4 ? e4.message : e4;
          return `<li><strong>${_(t3 || "تنبيه")}</strong> - ${_(String(n3 || ""))}</li>`;
        }).join("") : "<li>لا توجد تنبيهات تشغيلية حالياً.</li>", o2 = r2.length ? r2.slice(0, 6).map(function(e4) {
          const t3 = e4 && "object" == typeof e4 ? e4.priority : "", n3 = e4 && "object" == typeof e4 ? e4.action : e4;
          return `<li><strong>${_(t3 || "أولوية")}</strong> - ${_(String(n3 || ""))}</li>`;
        }).join("") : "<li>لا توجد توصيات كافية حالياً.</li>";
        R.insightsResult.innerHTML = `
  <div class="result-grid">
    <div class="result-item">
      <strong>عدد السجلات المحللة</strong>
      <div style="font-size:1.5rem;font-weight:700;">${_(String(t2.recordsAnalyzed || 0))}</div>
    </div>
    <div class="result-item">
      <strong>الحالات عالية الخطورة</strong>
      <div style="font-size:1.5rem;font-weight:700;">${_(String(t2.highRiskCases || 0))}</div>
    </div>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>التنبيهات التشغيلية</strong>
    <ul class="mini-list">${a2}</ul>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>التوصيات التنفيذية</strong>
    <ul class="mini-list">${o2}</ul>
  </div>
  <div class="result-grid" style="margin-top:10px;">
    <div class="result-item">
      <strong>أكثر التشخيصات</strong>
      <ul class="mini-list">${Se(e3.topDiagnoses)}</ul>
    </div>
    <div class="result-item">
      <strong>أكثر الأدوية</strong>
      <ul class="mini-list">${Se(e3.topMedications)}</ul>
    </div>
  </div>
`;
      }(e2.result || {}), Z(R.insightsStatus, `تم توليد التحليلات التشغيلية بنجاح عبر ${e2.model || "Gemini"}.`, "success");
    } catch (e2) {
      Z(R.insightsStatus, N(e2, "تعذر توليد التحليلات حالياً."), "error");
    } finally {
      X(R.insightsBtn, false);
    }
  } else Z(R.insightsStatus, "احفظ سجلات أولاً لتوليد التحليلات.", "error");
}

async function Vt() {
  const e2 = R.agentQuestion ? R.agentQuestion.value.trim() : "";
  if (!e2 || e2.length < 8) return void Z(R.agentStatus, "اكتب سؤالاً تنفيذياً واضحاً لا يقل عن 8 أحرف.", "error");
  const t2 = ae();
  if (!j.records.length && !t2.done) return void Z(R.agentStatus, "شغّل التحليل أو معالجة الدفعة أولاً قبل تشغيل الوكيل.", "error");
  X(R.agentBtn, true, "جاري تشغيل الوكيل..."), Z(R.agentStatus, "يجري تحليل السؤال عبر Gemini Flash...", "");
  const n2 = performance.now();
  try {
    let r2;
    try {
      r2 = await ue("/api/ai/medical-agent", { question: e2, records: j.records, hospitalProfile: ee(), batchReport: t2 });
    } catch (t3) {
      if (!Q()) throw t3;
      Z(R.agentStatus, "الخادم غير متاح، يتم عرض توصيات ديمو بدون كشف مفاتيح Gemini.", ""), r2 = await async function(e3) {
        var t4 = K();
        if (!t4.key) return buildGeminiDemoAgentResponse(e3, new Error("Backend Gemini غير متوفر للوكيل الذكي."));
        var n3 = e3 && e3.question ? e3.question : "", r3 = e3 && e3.records ? e3.records : [], a2 = e3 && e3.hospitalProfile ? e3.hospitalProfile : {}, o2 = r3.slice(0, 20).map(function(e4) {
          return { recordId: e4.recordId, patient: e4.patient, diagnoses: e4.diagnoses, medications: e4.medications, severity: e4.severity, alerts: e4.alerts };
        }), i2 = "السجلات الطبية المتاحة (" + r3.length + " سجل):\n" + JSON.stringify(o2, null, 1) + "\n\nالمنشأة: " + (a2.hospitalName || "غير محدد") + " - " + (a2.city || "") + "\n\nسؤال الإدارة:\n" + n3, s2 = await D(S, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t4.key }, body: JSON.stringify({ model: t4.model, messages: [{ role: "system", content: "أنت مستشار تشغيلي ذكي للمستشفيات السعودية مدمج في نظام الأرشيف الطبي.\nقدّم توصيات تنفيذية عملية بناءً على السجلات الطبية المتاحة والسياق المؤسسي.\nلا تخترع بيانات غير موجودة في السجلات.\nاستخدم مصطلحات طبية مهنية عربية دقيقة.\nنسّق الإجابة بنقاط واضحة مع أرقام." }, { role: "user", content: i2 }], temperature: 0.4, max_tokens: 4096 }) }, w);
        if (!s2.ok) {
          var c2 = {};
          try {
            c2 = await s2.json();
          } catch (e4) {
          }
          var u2 = c2 && c2.error && c2.error.message || "";
          if (401 === s2.status) throw new Error("اعتماد Backend Gemini غير صالح.");
          if (429 === s2.status) throw new Error("تم تجاوز حد الطلبات. انتظر قليلاً.");
          return buildGeminiDemoAgentResponse(e3, new Error(u2 || "خطأ من Gemini API (" + s2.status + ")"));
        }
        var l2 = await s2.json();
        if (!l2 || !l2.choices || !l2.choices.length) throw new Error("استجابة فارغة من الوكيل الذكي.");
        return { result: l2.choices[0].message.content || "", model: l2.model || t4.model, usage: l2.usage || null };
      }({ question: e2, records: j.records, hospitalProfile: ee() });
    }
    !function(e3) {
      if (!R.agentResult) return;
      if (!e3 || "object" != typeof e3) return void (R.agentResult.innerHTML = "<p>لا توجد مخرجات من الوكيل حالياً.</p>");
      const t3 = J(e3.actions || e3.recommendations || []), n3 = J(e3.risks || []), r3 = J(e3.kpis || []);
      R.agentResult.innerHTML = `
  <div class="result-item">
    <strong>الملخص التنفيذي</strong>
    <div>${_(String(e3.summary || e3.executiveSummary || "لا يوجد ملخص."))}</div>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>إجراءات موصى بها</strong>
    <ul class="mini-list">
      ${t3.length ? t3.slice(0, 8).map(function(e4) {
        return "string" == typeof e4 ? `<li>${_(e4)}</li>` : `<li><strong>${_(String(e4.priority || "أولوية"))}</strong> - ${_(String(e4.action || e4.text || ""))}</li>`;
      }).join("") : "<li>لا توجد إجراءات كافية حالياً.</li>"}
    </ul>
  </div>
  <div class="result-grid" style="margin-top:10px;">
    <div class="result-item">
      <strong>المخاطر</strong>
      <ul class="mini-list">
        ${n3.length ? n3.slice(0, 6).map(function(e4) {
        return "string" == typeof e4 ? `<li>${_(e4)}</li>` : `<li>${_(String(e4.message || e4.text || ""))}</li>`;
      }).join("") : "<li>لا توجد مخاطر مذكورة.</li>"}
      </ul>
    </div>
    <div class="result-item">
      <strong>مؤشرات الأداء</strong>
      <ul class="mini-list">
        ${r3.length ? r3.slice(0, 6).map(function(e4) {
        return "string" == typeof e4 ? `<li>${_(e4)}</li>` : `<li>${_(String(e4.name || "مؤشر"))}: ${_(String(e4.value || ""))}</li>`;
      }).join("") : "<li>لا توجد مؤشرات إضافية.</li>"}
      </ul>
    </div>
  </div>
`;
    }(r2.result || {}), Z(R.agentStatus, `تم توليد توصيات الوكيل الذكي بنجاح عبر ${r2.model || "Gemini"}.`, "success"), at("agent", { success: true, durationMs: Math.round(performance.now() - n2), model: r2.model || "Gemini" });
  } catch (e3) {
    Z(R.agentStatus, N(e3, "تعذر تشغيل الوكيل الذكي حالياً."), "error"), at("agent", { success: false, durationMs: Math.round(performance.now() - n2), reason: String(e3 && e3.message ? e3.message : "error") });
  } finally {
    X(R.agentBtn, false);
  }
}
function en(e2) {
  const t2 = String(e2 || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t2)) return t2;
  const n2 = /* @__PURE__ */ new Date();
  return `${n2.getFullYear()}-${String(n2.getMonth() + 1).padStart(2, "0")}-${String(n2.getDate()).padStart(2, "0")}`;
}
function tn(e2) {
  const t2 = String(e2 || "").toLowerCase();
  return t2.includes("ذكر") || "male" === t2 || t2.includes("man") ? "male" : t2.includes("أنث") || "female" === t2 || t2.includes("woman") ? "female" : "unknown";
}
function nn(e2, t2) {
  const n2 = String(e2 || "").replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 32);
  return n2 || t2;
}
function rn(e2) {
  const t2 = e2 && "object" == typeof e2 ? e2 : {}, n2 = t2.patient && "object" == typeof t2.patient ? t2.patient : {}, r2 = t2.encounter && "object" == typeof t2.encounter ? t2.encounter : {}, a2 = t2.summary && "object" == typeof t2.summary ? t2.summary : {}, o2 = J(t2.diagnoses).map(function(e3) {
    if ("string" == typeof e3) return { name: e3, status: null, certainty: null };
    if (!e3 || "object" != typeof e3) return null;
    const t3 = e3.name || e3.diagnosis || e3.value;
    return t3 ? { name: t3, status: e3.status || null, certainty: e3.certainty || null } : null;
  }).filter(Boolean);
  const i2 = me(t2.medications), s2 = pe(t2.labs), c2 = nn(t2.recordId || "", `rec${Date.now()}`), u2 = nn(n2.medicalRecordNumber || n2.name || "", `pat-${c2}`), l2 = `enc-${c2}`, d2 = [];
  return d2.push({ resourceType: "Patient", id: u2, active: true, name: [{ text: n2.name || "غير معروف" }], gender: tn(n2.gender), birthDate: void n2.age, extension: [{ url: "https://brightai.site/fhir/StructureDefinition/patient-age", valueInteger: Number(n2.age) || null }, { url: "https://brightai.site/fhir/StructureDefinition/patient-city", valueString: n2.city || null }] }), d2.push({ resourceType: "Encounter", id: l2, status: "finished", class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB" }, subject: { reference: `Patient/${u2}` }, period: { start: `${en(r2.date || t2.capturedAt)}T00:00:00+03:00` }, serviceProvider: { display: n2.hospital || t2.sourceHospital || "مستشفى سعودي" } }), o2.forEach(function(e3, t3) {
    d2.push({ resourceType: "Condition", id: `cond-${c2}-${t3 + 1}`, clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "history" === e3.status ? "inactive" : "active" }] }, verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "suspected" === e3.certainty ? "provisional" : "confirmed" }] }, code: { text: e3.name }, subject: { reference: `Patient/${u2}` }, encounter: { reference: `Encounter/${l2}` } });
  }), i2.forEach(function(e3, t3) {
    d2.push({ resourceType: "MedicationStatement", id: `med-${c2}-${t3 + 1}`, status: "active", subject: { reference: `Patient/${u2}` }, medicationCodeableConcept: { text: e3.name }, dosage: [{ text: [e3.dose, e3.frequency].filter(Boolean).join(" - ") || e3.name }] });
  }), s2.forEach(function(e3, t3) {
    d2.push({ resourceType: "Observation", id: `obs-${c2}-${t3 + 1}`, status: "final", code: { text: e3.name }, subject: { reference: `Patient/${u2}` }, encounter: { reference: `Encounter/${l2}` }, valueString: [e3.value, e3.unit].filter(Boolean).join(" ") || "غير متوفر", interpretation: e3.status ? [{ text: e3.status }] : void 0 });
  }), d2.push({ resourceType: "CarePlan", id: `care-${c2}`, status: "active", intent: "plan", subject: { reference: `Patient/${u2}` }, description: a2.plan || a2.nextStep || t2.summary || "خطة متابعة سريرية" }), { resourceType: "Bundle", type: "collection", timestamp: (/* @__PURE__ */ new Date()).toISOString(), identifier: { system: "https://brightai.site/medical-archive", value: c2 }, entry: d2.map(function(e3) {
    return { fullUrl: `urn:uuid:${e3.id}`, resource: e3 };
  }) };
}
function an(e2) {
  const t2 = String(null == e2 ? "" : e2);
  return /[",\n]/.test(t2) ? `"${t2.replace(/"/g, '""')}"` : t2;
}
function on(e2) {
  const t2 = e2 && "object" == typeof e2 ? e2 : {}, n2 = t2.patient && "object" == typeof t2.patient ? t2.patient : {}, r2 = t2.summary && "object" == typeof t2.summary ? t2.summary : {}, a2 = ge(t2.diagnoses), o2 = me(t2.medications), i2 = /* @__PURE__ */ new Date(), s2 = `${(c2 = i2).getFullYear()}${String(c2.getMonth() + 1).padStart(2, "0")}${String(c2.getDate()).padStart(2, "0")}${String(c2.getHours()).padStart(2, "0")}${String(c2.getMinutes()).padStart(2, "0")}${String(c2.getSeconds()).padStart(2, "0")}`;
  var c2;
  const u2 = (n2.name || "غير معروف").replace(/\s+/g, "^"), l2 = `PID|1||${n2.medicalRecordNumber || t2.recordId || ""}||${u2}||${en(t2.capturedAt).replace(/-/g, "")}|${tn(n2.gender)}|||${n2.city || ""}`, d2 = a2.length ? a2.map(function(e3, t3) {
    return `DG1|${t3 + 1}||${e3}||||A`;
  }) : ["DG1|1||NO_DIAGNOSIS||||A"], g2 = o2.length ? o2.map(function(e3, t3) {
    return `RXE|${t3 + 1}|${e3.name}|${e3.dose || ""}|${e3.frequency || ""}`;
  }) : ["RXE|1|NO_MEDICATION||"], m2 = `NTE|1||${r2.problem || ""} ${r2.plan || ""}`.trim();
  return [`MSH|^~\\&|BRIGHTAI|MEDARCHIVE|EHR|HOSPITAL|${s2}||ORU^R01|${t2.recordId || s2}|P|2.5`, l2, `PV1|1|O|${n2.hospital || t2.sourceHospital || ""}|${t2.encounter && t2.encounter.department ? t2.encounter.department : ""}`].concat(d2).concat(g2).concat([m2]).join("\r\n");
}
function sn(e2, t2, n2) {
  const r2 = new Blob([n2], { type: t2 }), a2 = URL.createObjectURL(r2), o2 = document.createElement("a");
  o2.href = a2, o2.download = e2, document.body.appendChild(o2), o2.click(), document.body.removeChild(o2), URL.revokeObjectURL(a2);
}
Object.assign(T, {
  lab: "تقرير مختبر - مستشفى الملك فهد\nالمريض: أحمد محمد سالم\nرقم الملف: MRN-22918\nالعمر: 58 سنة\nالجنس: ذكر\nالتاريخ: 2026-04-14\nالقسم: عيادة السكري\nالتشخيص المعروف: داء سكري نوع ثاني وارتفاع ضغط الدم.\nنتائج المختبر: HbA1c = 9.4% (مرتفع)، Glucose fasting = 186 mg/dL (مرتفع)، LDL = 142 mg/dL (مرتفع)، كرياتينين = 1.1 mg/dL.\nالأدوية الحالية: Metformin 1000mg مرتين يومياً، Amlodipine 5mg يومياً، Lisinopril 10mg يومياً.\nملاحظة: سكر مرتفع مع أدوية ضغط. يتطلب مراجعة مختص قبل تعديل الخطة.",
  radiology: "تقرير أشعة - قسم الأشعة\nالمريضة: نورة عبدالرحمن\nرقم الملف: MRN-44210\nالعمر: 46 سنة\nالتاريخ: 2026-04-12\nالفحص: CT Chest\nالنتيجة: ارتشاحات رئوية خفيفة في الفص السفلي الأيمن، لا توجد كتلة واضحة، لا يوجد انصباب جنبي.\nالانطباع: تغيرات التهابية تحتاج ربطاً مع الأعراض والفحوصات المخبرية.\nالتوصية: مراجعة طبيب الصدرية إذا استمرت الأعراض. لا تقدم النتيجة تشخيصاً نهائياً.",
  discharge: "ملخص خروج - قسم الباطنة\nالمريض: خالد عبدالله الحربي\nرقم الملف: MRN-77102\nالعمر: 64 سنة\nالتاريخ: 2026-04-10\nسبب التنويم: ألم صدري وضيق نفس مع تاريخ ارتفاع ضغط وسكري.\nالتشخيصات عند الخروج: ارتفاع ضغط الدم، داء سكري نوع ثاني، اشتباه ذبحة مستقرة بعد استبعاد مؤشرات حرجة.\nالأدوية عند الخروج: Aspirin 81mg يومياً، Atorvastatin 20mg ليلاً، Metformin 500mg مرتين يومياً، Amlodipine 5mg يومياً.\nالخطة: متابعة القلب خلال أسبوعين، ضبط السكر والضغط، مراجعة الطوارئ عند ألم صدري شديد. يتطلب مراجعة مختص.",
  prescription: "وصفة طبية - عيادة القلب\nالمريض: صالح محمد العتيبي\nرقم الملف: MRN-33880\nالعمر: 61 سنة\nالتاريخ: 2026-04-16\nالتشخيص: ارتفاع ضغط الدم مع سكري نوع ثاني.\nالأدوية المصروفة: Lisinopril 10mg مرة يومياً، Amlodipine 5mg مرة يومياً، Metformin 1000mg مرتين يومياً.\nتنبيهات: مراجعة وظائف الكلى والبوتاسيوم خلال 4 أسابيع، ومراجعة مختص عند الدوخة أو هبوط الضغط.\nملاحظات الخصوصية: تحتوي الوصفة على بيانات صحية شخصية وتتطلب صلاحيات وصول حسب الدور."
});
function cn() {
  return j.lastExtract ? j.lastExtract : j.records.length ? j.records[j.records.length - 1] : null;
}
function un() {
  const e2 = cn();
  if (!e2) return void Z(R.exportStatus, "لا يوجد سجل للتصدير. حلل تقريراً أولاً.", "error");
  const t2 = rn(e2);
  sn(`medical-fhir-${e2.recordId || Date.now()}.json`, "application/fhir+json;charset=utf-8", JSON.stringify(t2, null, 2)), Z(R.exportStatus, "تم تصدير ملف FHIR JSON بنجاح.", "success");
}
function ln() {
  const e2 = j.records.length ? j.records : j.lastExtract ? [j.lastExtract] : [];
  if (!e2.length) return void Z(R.exportStatus, "لا توجد بيانات للتصدير. حلل تقريراً أولاً.", "error");
  const t2 = function(e3) {
    const t3 = e3.map(function(e4) {
      const t4 = e4.patient && "object" == typeof e4.patient ? e4.patient : {}, n2 = e4.summary && "object" == typeof e4.summary ? e4.summary : {}, r2 = ge(e4.diagnoses).join(" | "), a2 = me(e4.medications).map(function(e5) {
        return [e5.name, e5.dose, e5.frequency].filter(Boolean).join(" ");
      }).join(" | "), o2 = ge(e4.alerts).join(" | ");
      return [e4.recordId || "", t4.name || "", null != t4.age ? String(t4.age) : "", t4.gender || "", t4.hospital || e4.sourceHospital || "", t4.city || "", r2, a2, o2, n2.problem || "", n2.plan || "", e4.capturedAt || e4.savedAt || ""].map(an).join(",");
    });
    return `${["record_id", "patient_name", "patient_age", "patient_gender", "hospital", "city", "diagnoses", "medications", "alerts", "summary_problem", "summary_plan", "captured_at"].join(",")}
${t3.join("\n")}`;
  }(e2);
  sn("medical-archive-ehr.csv", "text/csv;charset=utf-8", t2), Z(R.exportStatus, "تم تصدير CSV بنجاح.", "success");
}
function dn() {
  const e2 = cn();
  if (!e2) return void Z(R.exportStatus, "لا يوجد سجل للتصدير. حلل تقريراً أولاً.", "error");
  const t2 = on(e2);
  sn(`medical-hl7-${e2.recordId || Date.now()}.hl7`, "text/plain;charset=utf-8", t2), Z(R.exportStatus, "تم تصدير HL7 بنجاح.", "success");
}
function gn() {
  if (!j.records.length) return void Z(R.exportStatus, "لا توجد سجلات محفوظة لتصديرها.", "error");
  sn("medical-archive-fhir.ndjson", "application/x-ndjson;charset=utf-8", j.records.map(function(e2) {
    return JSON.stringify(rn(e2));
  }).join("\n")), Z(R.exportStatus, "تم تصدير جميع السجلات بصيغة NDJSON بنجاح.", "success");
}
function mn(e2) {
  const t2 = T[e2];
  t2 && R.reportInput && (R.reportInput.value = t2, Z(R.extractStatus, "تم تحميل تقرير نموذجي. يمكنك التعديل ثم بدء التحليل.", "success"));
}
function seedMedicalDemoRecords() {
  if (j.records.length || "function" != typeof buildGeminiDemoExtract) return;
  ["lab", "prescription", "discharge"].forEach(function(e2) {
    const t2 = T[e2];
    if (!t2) return;
    const n2 = "function" == typeof normalizeMedicalArchiveResult ? normalizeMedicalArchiveResult(buildGeminiDemoExtract(t2)) : buildGeminiDemoExtract(t2);
    n2.recordId = `demo-${e2}`;
    n2.savedAt = (/* @__PURE__ */ new Date()).toLocaleString("ar-SA");
    n2.sourceHospital = ee().hospitalName || "مستشفى الملك فهد";
    n2.sourceFile = `${e2}-sample-report.txt`;
    j.records.push(n2);
  });
  fe(), de();
}
function pn() {
  const e2 = R.leadHospital ? R.leadHospital.value.trim() : "", t2 = R.leadName ? R.leadName.value.trim() : "", n2 = R.leadPhone ? R.leadPhone.value.trim() : "";
  if (!e2 || !t2 || !n2) return void Z(R.leadStatus, "أدخل اسم المستشفى واسم المسؤول ورقم التواصل.", "error");
  const requestType = document.getElementById("leadRequestType") ? document.getElementById("leadRequestType").value : "اطلب تجربة على بيانات منشأتك";
  const r2 = ee(), a2 = ["مرحباً فريق Bright AI", requestType, "أرغب بتفعيل نظام الأرشيف الطبي الذكي للمستشفى.", `اسم المستشفى: ${e2}`, `اسم المسؤول: ${t2}`, `رقم التواصل: ${n2}`, `المدينة: ${r2.city || "غير محدد"}`, `القسم: ${r2.department || "غير محدد"}`, `عدد السجلات المجربة حالياً: ${j.records.length}`].join("\n"), o2 = `https://api.whatsapp.com/send?phone=966538229013&text=${encodeURIComponent(a2)}`;
  window.open(o2, "_blank", "noopener,noreferrer"), Z(R.leadStatus, "تم فتح واتساب وإعداد رسالة طلب التجربة للمستشفى.", "success"), at("lead", { success: true, hospital: e2 });
}
function hn(e2, t2) {
  Z(R.connectionStatus, e2, t2);
}
function fn() {
  H(), j.apiBase ? hn("تم حفظ إعدادات Backend. مفاتيح Gemini تبقى على الخادم فقط.", "success") : hn("تم حفظ وضع الديمو. أضف API Base للخادم عند التشغيل الإنتاجي.", "success");
}
async function vn() {
  H(), X(R.testConnectionBtn, true, "جاري اختبار الاتصال..."), hn("يتم الآن اختبار اتصال Backend فقط...", "");
  try {
    const e2 = await le();
    "backend" === e2.mode ? hn(`نجح الاتصال بخادم BrightAI على: ${e2.base}`, "success") : hn("لم يتم العثور على Backend حالياً. سيعمل الديمو بعينات محلية بدون كشف مفاتيح Gemini.", "success");
  } catch (e2) {
    hn(N(e2, "تعذر اختبار الاتصال حالياً."), "error");
  } finally {
    X(R.testConnectionBtn, false);
  }
}
function yn() {
  R.analyzeBtn && R.analyzeBtn.addEventListener("click", ve), R.saveRecordBtn && R.saveRecordBtn.addEventListener("click", ye), R.searchBtn && R.searchBtn.addEventListener("click", Fe), R.refreshDashboardBtn && R.refreshDashboardBtn.addEventListener("click", function() {
    wt();
  }), R.timelineGranularitySelect && R.timelineGranularitySelect.addEventListener("change", function() {
    bt("تم تحديث الخط الزمني وفق النطاق المختار.");
  }), R.dashboardRoleSelect && R.dashboardRoleSelect.addEventListener("change", function() {
    j.dashboardRole = R.dashboardRoleSelect.value || "director", F(p, j.dashboardRole);
  }), R.applyRoleTemplateBtn && R.applyRoleTemplateBtn.addEventListener("click", function() {
    !function(e2) {
      if (!L[e2]) return;
      j.dashboardRole = e2;
      const t2 = new Set(L[e2]);
      j.dashboardHiddenWidgets = new Set(B.filter(function(e3) {
        return !t2.has(e3);
      })), j.dashboardWidgetOrder = B.slice(), R.dashboardRoleSelect && (R.dashboardRoleSelect.value = e2), ft(), ht(), vt(), bt(`تم تطبيق قالب ${e2} بنجاح.`);
    }(R.dashboardRoleSelect ? R.dashboardRoleSelect.value : "director");
  }), R.saveDashboardLayoutBtn && R.saveDashboardLayoutBtn.addEventListener("click", function() {
    Et(), vt(), pt("تم حفظ تخطيط اللوحة لهذا المستخدم.", "success");
  }), R.resetDashboardLayoutBtn && R.resetDashboardLayoutBtn.addEventListener("click", St), R.liveReconnectBtn && R.liveReconnectBtn.addEventListener("click", function() {
    mt(true);
  }), R.widgetToggles && R.widgetToggles.length && R.widgetToggles.forEach(function(e2) {
    e2.addEventListener("change", function() {
      yt(e2.getAttribute("data-widget-toggle"), e2.checked);
    });
  }), R.dashboardWidgets && R.dashboardWidgets.addEventListener("click", function(e2) {
    const t2 = e2.target;
    if (!t2 || !t2.getAttribute) return;
    const n2 = t2.getAttribute("data-widget-hide");
    n2 && yt(n2, false);
  }), R.searchQuery && (R.searchQuery.addEventListener("input", He), R.searchQuery.addEventListener("focus", function() {
    Pe(qe(R.searchQuery.value || ""));
  }), R.searchQuery.addEventListener("blur", function() {
    setTimeout(function() {
      Pe([]);
    }, 120);
  })), R.searchSuggestions && R.searchSuggestions.addEventListener("click", Qe), R.voiceSearchBtn && R.voiceSearchBtn.addEventListener("click", Ye), R.voiceFileBtn && R.voiceFileBtn.addEventListener("click", Ve), R.voiceFileInput && R.voiceFileInput.addEventListener("change", et), R.imageSearchBtn && R.imageSearchBtn.addEventListener("click", tt), R.imageSearchInput && R.imageSearchInput.addEventListener("change", nt), R.applyFiltersBtn && R.applyFiltersBtn.addEventListener("click", _e), R.saveSearchBtn && R.saveSearchBtn.addEventListener("click", We), R.loadSavedSearchBtn && R.loadSavedSearchBtn.addEventListener("click", Ge), R.searchPrevPageBtn && R.searchPrevPageBtn.addEventListener("click", Ue), R.searchNextPageBtn && R.searchNextPageBtn.addEventListener("click", ze), R.exportSearchCsvBtn && R.exportSearchCsvBtn.addEventListener("click", Je), R.exportSearchExcelBtn && R.exportSearchExcelBtn.addEventListener("click", Ze), R.exportSearchPdfBtn && R.exportSearchPdfBtn.addEventListener("click", Xe), [R.searchEngineProvider, R.searchEngineEndpoint, R.searchEngineIndex, R.searchEngineApiKey, R.searchEngineAppId].forEach(function(e2) {
    e2 && (e2.addEventListener("change", G), e2.addEventListener("blur", G));
  }), R.insightsBtn && R.insightsBtn.addEventListener("click", Bt), R.extractFileBtn && R.extractFileBtn.addEventListener("click", Jt), R.processBatchBtn && R.processBatchBtn.addEventListener("click", Kt), R.cancelBatchBtn && R.cancelBatchBtn.addEventListener("click", Wt), R.resumeBatchBtn && R.resumeBatchBtn.addEventListener("click", Gt), R.analyzeBatchBtn && R.analyzeBatchBtn.addEventListener("click", zt), R.pickFilesBtn && R.pickFilesBtn.addEventListener("click", Rt), R.pickFolderBtn && R.pickFolderBtn.addEventListener("click", Pt), R.reportFile && R.reportFile.addEventListener("change", qt), R.reportFolder && R.reportFolder.addEventListener("change", qt), R.fileQueue && R.fileQueue.addEventListener("click", _t), R.dropZone && (R.dropZone.addEventListener("dragenter", function(e2) {
    e2.preventDefault(), Dt(true);
  }), R.dropZone.addEventListener("dragover", function(e2) {
    e2.preventDefault(), Dt(true);
  }), R.dropZone.addEventListener("dragleave", function() {
    Dt(false);
  }), R.dropZone.addEventListener("drop", function(e2) {
    e2.preventDefault(), Dt(false);
    jt(e2.dataTransfer ? e2.dataTransfer.files : []);
  }), R.dropZone.addEventListener("keydown", function(e2) {
    "Enter" !== e2.key && " " !== e2.key || (e2.preventDefault(), Rt());
  })), R.saveStorageBtn && R.saveStorageBtn.addEventListener("click", Xt), R.uploadStorageBtn && R.uploadStorageBtn.addEventListener("click", Yt), R.agentBtn && R.agentBtn.addEventListener("click", Vt), R.exportFhirBtn && R.exportFhirBtn.addEventListener("click", un), R.exportCsvBtn && R.exportCsvBtn.addEventListener("click", ln), R.exportHl7Btn && R.exportHl7Btn.addEventListener("click", dn), R.exportArchiveFhirBtn && R.exportArchiveFhirBtn.addEventListener("click", gn), R.saveConnectionBtn && R.saveConnectionBtn.addEventListener("click", fn), R.testConnectionBtn && R.testConnectionBtn.addEventListener("click", vn), R.leadBtn && R.leadBtn.addEventListener("click", pn), R.sampleButtons.forEach(function(e2) {
    e2.addEventListener("click", function() {
      mn(e2.getAttribute("data-sample"));
    });
  }), window.addEventListener("beforeunload", function() {
    gt();
  });
}
function Sn() {
  xt(), function() {
    if (!window.Chart || "function" != typeof window.Chart.register) return;
    const e2 = window.ChartZoom || window.zoomPlugin || window["chartjs-plugin-zoom"] || (window.ChartZoomPlugin ? window.ChartZoomPlugin : null);
    if (!e2 || !e2.id) return;
    window.Chart.registry && window.Chart.registry.plugins && window.Chart.registry.plugins.get && window.Chart.registry.plugins.get(e2.id) || window.Chart.register(e2);
  }(), function() {
    const e2 = P(O(r));
    e2 && (j.apiBase = e2, R.apiBaseInput && (R.apiBaseInput.value = e2));
    F(v, "");
    const n2 = O(y).trim();
    n2 && (j.geminiModel = n2, R.geminiModelInput && (R.geminiModelInput.value = n2));
    const S2 = O(a).trim(), E2 = O(o).trim(), w2 = O(i).trim();
    S2 && (j.storageProvider = S2, R.storageProvider && (R.storageProvider.value = S2)), E2 && (j.storageEndpoint = E2, R.storageEndpoint && (R.storageEndpoint.value = E2)), w2 && (j.storageToken = w2, R.storageToken && (R.storageToken.value = w2));
    const b2 = O(c).trim(), I2 = O(u).trim(), x2 = O(l).trim(), $2 = O(d).trim(), A2 = O(g).trim(), k2 = O(s).trim();
    if (b2 && (j.searchProvider = b2, R.searchEngineProvider && (R.searchEngineProvider.value = b2)), I2 && (j.searchEndpoint = I2, R.searchEngineEndpoint && (R.searchEngineEndpoint.value = I2)), x2 && (j.searchIndex = x2, R.searchEngineIndex && (R.searchEngineIndex.value = x2)), $2 && (j.searchApiKey = $2, R.searchEngineApiKey && (R.searchEngineApiKey.value = $2)), A2 && (j.searchAppId = A2, R.searchEngineAppId && (R.searchEngineAppId.value = A2)), k2) try {
      const e3 = JSON.parse(k2);
      Array.isArray(e3) && (j.searchSaved = e3.filter(function(e4) {
        return e4 && "object" == typeof e4 && "string" == typeof e4.query;
      }).slice(0, 50));
    } catch (e3) {
      j.searchSaved = [];
    }
    const C2 = O(p).trim(), M2 = O(m).trim(), T2 = O(h).trim(), q2 = O(f).trim();
    if (C2 && L[C2] && (j.dashboardRole = C2, R.dashboardRoleSelect && (R.dashboardRoleSelect.value = C2)), M2) try {
      const e3 = JSON.parse(M2);
      if (e3 && Array.isArray(e3.order) && Array.isArray(e3.hidden)) {
        const t3 = e3.order.filter(function(e4) {
          return B.includes(e4);
        });
        j.dashboardWidgetOrder = t3.length ? t3 : B.slice(), j.dashboardHiddenWidgets = new Set(e3.hidden.filter(function(e4) {
          return B.includes(e4);
        }));
      }
    } catch (e3) {
      j.dashboardWidgetOrder = B.slice();
    }
    if (T2) try {
      const e3 = JSON.parse(T2);
      Array.isArray(e3) && (j.dashboardHistory = e3.slice(-180));
    } catch (e3) {
      j.dashboardHistory = [];
    }
    if (q2) try {
      const e3 = JSON.parse(q2);
      Array.isArray(e3) && (j.dashboardEvents = e3.slice(-1e3));
    } catch (e3) {
      j.dashboardEvents = [];
    }
  }(), yn(), function() {
    if (!R.dashboardWidgets) return;
    Array.from(R.dashboardWidgets.querySelectorAll("[data-widget-id]")).forEach(function(e2) {
      e2.addEventListener("dragstart", function() {
        j.widgetDragSourceId = e2.getAttribute("data-widget-id") || "", e2.classList.add("dragging");
      }), e2.addEventListener("dragend", function() {
        e2.classList.remove("dragging"), j.widgetDragSourceId = "", Et(), vt();
      }), e2.addEventListener("dragover", function(e3) {
        e3.preventDefault();
      }), e2.addEventListener("drop", function(t2) {
        t2.preventDefault();
        const n2 = e2.getAttribute("data-widget-id"), r2 = j.widgetDragSourceId;
        if (!r2 || !n2 || r2 === n2) return;
        const a2 = R.dashboardWidgets.querySelector(`[data-widget-id="${r2}"]`), o2 = R.dashboardWidgets.querySelector(`[data-widget-id="${n2}"]`);
        a2 && o2 && (R.dashboardWidgets.insertBefore(a2, o2), Et(), vt(), bt("تم تحديث ترتيب الودجت."));
      });
    });
  }(), ft(), ht(), he(null), fe(), se(), ie(), oe(), Pe([]), De(null), Ne([], {}), Ke(), ut(), de(), seedMedicalDemoRecords(), mn("lab"), R.searchQuery && (R.searchQuery.value = "اعرض مرضى لديهم سكر مرتفع وأدوية ضغط"), "function" == typeof Fe && setTimeout(function() { Fe(); }, 250), R.storageProvider && j.storageProvider && (R.storageProvider.value = j.storageProvider), R.storageEndpoint && j.storageEndpoint && (R.storageEndpoint.value = j.storageEndpoint), R.storageToken && j.storageToken && (R.storageToken.value = j.storageToken), "none" !== (j.storageProvider || "none") && Z(R.storageStatus, `إعداد التخزين المحفوظ: ${j.storageProvider}`, "success"), R.searchEngineProvider && j.searchProvider && (R.searchEngineProvider.value = j.searchProvider), R.searchEngineEndpoint && j.searchEndpoint && (R.searchEngineEndpoint.value = j.searchEndpoint), R.searchEngineIndex && j.searchIndex && (R.searchEngineIndex.value = j.searchIndex), R.searchEngineApiKey && j.searchApiKey && (R.searchEngineApiKey.value = j.searchApiKey), R.searchEngineAppId && j.searchAppId && (R.searchEngineAppId.value = j.searchAppId), R.dashboardRoleSelect && (R.dashboardRoleSelect.value = j.dashboardRole || "director"), bt("تم تحميل لوحة التحكم التفاعلية."), mt(false), le().then(function(e2) {
    return "backend" === e2.mode ? (Z(R.extractStatus, "الخدمة جاهزة. تحليل Gemini يعمل عبر Backend فقط.", "success"), void hn(`متصل بخادم BrightAI: ${e2.base}`, "success")) : (Z(R.extractStatus, "وضع الديمو جاهز. عند الإنتاج يجب تشغيل Backend للاتصال بـ Gemini دون كشف المفاتيح في الواجهة.", "success"), void hn("اتصال Gemini المباشر معطل في الواجهة الإنتاجية.", "success"));
  });
}

function Se(e2) {
  const t2 = J(e2);
  return t2.length ? t2.slice(0, 5).map(function(e3) {
    const t3 = e3 && "object" == typeof e3 ? e3.name : e3, n2 = e3 && "object" == typeof e3 ? e3.count : null, r2 = null != n2 ? ` (${n2})` : "";
    return `<li>${_(String(t3 || "غير محدد"))}${_(String(r2))}</li>`;
  }).join("") : "<li>لا توجد بيانات كافية</li>";
}
function Ee(e2) {
  return String(e2 || "").toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function we(e2) {
  return Ee(e2).split(" ").map(function(e3) {
    return e3.trim();
  }).filter(function(e3) {
    return e3.length >= 2;
  });
}
function be(e2) {
  const t2 = Number(e2);
  return !Number.isFinite(t2) || t2 < 0 || t2 > 130 ? null : t2;
}
function Be(e2) {
  if (!e2) return null;
  const t2 = new Date(e2).getTime();
  return Number.isFinite(t2) ? t2 : null;
}
function Ie() {
  return { ageMin: be(R.filterAgeMin ? R.filterAgeMin.value : ""), ageMax: be(R.filterAgeMax ? R.filterAgeMax.value : ""), gender: R.filterGender ? R.filterGender.value.trim() : "", dateFrom: Be(R.filterDateFrom ? R.filterDateFrom.value : ""), dateTo: Be(R.filterDateTo ? R.filterDateTo.value : ""), department: R.filterDepartment ? R.filterDepartment.value.trim() : "", excludeTerms: R.filterExclude ? R.filterExclude.value.split(/[،,]/).map(function(e2) {
    return Ee(e2);
  }).filter(Boolean) : [], nearCity: R.filterNearCity ? R.filterNearCity.value.trim() : "", radiusKm: Number(R.filterRadiusKm ? R.filterRadiusKm.value : 0) || 0, semanticMode: R.semanticMode ? R.semanticMode.value : "on" };
}
function xe(e2, t2) {
  const n2 = we(e2);
  if (!n2.length) return { corrected: e2, changed: false };
  const r2 = function(e3) {
    const t3 = /* @__PURE__ */ new Set();
    return J(e3).forEach(function(e4) {
      we($e(e4)).forEach(function(e5) {
        t3.add(e5);
      });
    }), Object.keys(C).forEach(function(e4) {
      we(e4).forEach(function(e5) {
        t3.add(e5);
      }), J(C[e4]).forEach(function(e5) {
        we(e5).forEach(function(e6) {
          t3.add(e6);
        });
      });
    }), Array.from(t3);
  }(t2), a2 = n2.map(function(e3) {
    if (r2.includes(e3)) return e3;
    let t3 = e3, n3 = 99;
    return r2.forEach(function(r3) {
      if (Math.abs(r3.length - e3.length) > 2) return;
      const a3 = function(e4, t4) {
        const n4 = String(e4 || ""), r4 = String(t4 || ""), a4 = n4.length + 1, o2 = r4.length + 1, i2 = Array.from({ length: a4 }, function() {
          return new Array(o2).fill(0);
        });
        for (let e5 = 0; e5 < a4; e5 += 1) i2[e5][0] = e5;
        for (let e5 = 0; e5 < o2; e5 += 1) i2[0][e5] = e5;
        for (let e5 = 1; e5 < a4; e5 += 1) for (let t5 = 1; t5 < o2; t5 += 1) {
          const a5 = n4[e5 - 1] === r4[t5 - 1] ? 0 : 1;
          i2[e5][t5] = Math.min(i2[e5 - 1][t5] + 1, i2[e5][t5 - 1] + 1, i2[e5 - 1][t5 - 1] + a5);
        }
        return i2[a4 - 1][o2 - 1];
      }(e3, r3);
      a3 < n3 && (n3 = a3, t3 = r3);
    }), n3 <= 2 ? t3 : e3;
  }).join(" ").trim();
  return { corrected: a2, changed: Ee(a2) !== Ee(e2) };
}
function $e(e2) {
  const t2 = e2 && "object" == typeof e2 ? e2 : {}, n2 = t2.patient && "object" == typeof t2.patient ? t2.patient : {}, r2 = t2.summary && "object" == typeof t2.summary ? t2.summary : {};
  return [t2.recordId || "", t2.sourceFile || "", t2.sourceHospital || "", n2.name || "", n2.gender || "", n2.city || "", n2.hospital || "", t2.encounter && t2.encounter.department ? t2.encounter.department : "", ge(t2.diagnoses).join(" "), me(t2.medications).map(function(e3) {
    return [e3.name, e3.dose, e3.frequency].filter(Boolean).join(" ");
  }).join(" "), ge(t2.alerts).join(" "), pe(t2.labs).map(function(e3) {
    return [e3.name, e3.value, e3.unit, e3.status].filter(Boolean).join(" ");
  }).join(" "), r2.problem || "", r2.plan || "", r2.nextStep || "", t2.savedAt || "", t2.capturedAt || ""].join(" ").trim();
}
function Ae(e2, t2) {
  if (!t2.nearCity || !t2.radiusKm) return { ok: true, distanceKm: null };
  const n2 = function(e3) {
    const t3 = Ee(e3);
    if (!t3) return null;
    const n3 = { riyadh: "الرياض", jeddah: "جدة", mecca: "مكة", makkah: "مكة", madinah: "المدينة", medina: "المدينة", dammam: "الدمام", khobar: "الخبر", taif: "الطائف", abha: "أبها", tabuk: "تبوك", jazan: "جازان", hail: "حائل", buraydah: "بريدة", buraidah: "بريدة" };
    if (n3[t3] && M[n3[t3]]) return M[n3[t3]];
    const r3 = Object.keys(M).find(function(e4) {
      const n4 = Ee(e4);
      return n4 === t3 || n4.includes(t3) || t3.includes(n4);
    });
    return r3 ? M[r3] : null;
  }(t2.nearCity);
  if (!n2) return { ok: true, distanceKm: null };
  const r2 = Ee(e2 && e2.patient && e2.patient.city || e2.sourceHospital || "");
  let a2 = null;
  return Object.keys(M).forEach(function(e3) {
    if (!r2.includes(Ee(e3))) return;
    const t3 = M[e3], o2 = function(e4, t4, n3, r3) {
      const a3 = function(e5) {
        return e5 * (Math.PI / 180);
      }, o3 = a3(n3 - e4), i2 = a3(r3 - t4), s2 = Math.sin(o3 / 2) * Math.sin(o3 / 2) + Math.cos(a3(e4)) * Math.cos(a3(n3)) * Math.sin(i2 / 2) * Math.sin(i2 / 2);
      return 2 * Math.atan2(Math.sqrt(s2), Math.sqrt(1 - s2)) * 6371;
    }(n2.lat, n2.lng, t3.lat, t3.lng);
    (null == a2 || o2 < a2) && (a2 = o2);
  }), null == a2 ? { ok: false, distanceKm: null } : { ok: a2 <= t2.radiusKm, distanceKm: a2 };
}
function ke(e2, t2, n2) {
  const r2 = { query: Ee(e2), filters: t2, page: n2, recordsVersion: j.records.length ? j.records[j.records.length - 1].recordId : "0", provider: j.searchProvider || "local", endpoint: j.searchEndpoint || "", index: j.searchIndex || "" };
  return JSON.stringify(r2);
}
function Ce(e2) {
  return String(e2 && e2.encounter && e2.encounter.department || e2 && e2.sourceDepartment || "").trim();
}
function Me(e2) {
  const t2 = Ee(e2);
  return t2 ? t2.includes("male") || t2.includes("ذكر") ? "male" : t2.includes("female") || t2.includes("انث") || t2.includes("أنث") ? "female" : "unknown" : "";
}
function Le(e2, t2) {
  const n2 = e2 && e2.patient && "object" == typeof e2.patient ? e2.patient : {}, r2 = be(n2.age);
  if (null != t2.ageMin && (null == r2 || r2 < t2.ageMin)) return false;
  if (null != t2.ageMax && (null == r2 || r2 > t2.ageMax)) return false;
  if (t2.gender) {
    if (Me(n2.gender) !== Me(t2.gender)) return false;
  }
  const a2 = Be(e2 && e2.encounter && e2.encounter.date || e2.capturedAt || e2.savedAt);
  if (null != t2.dateFrom && (null == a2 || a2 < t2.dateFrom)) return false;
  if (null != t2.dateTo && (null == a2 || a2 > t2.dateTo + 864e5)) return false;
  const o2 = Ee(Ce(e2));
  if (t2.department) {
    const e3 = Ee(t2.department);
    if (!o2.includes(e3)) return false;
  }
  const i2 = Ee($e(e2));
  if (t2.excludeTerms.length) {
    if (t2.excludeTerms.some(function(e3) {
      return e3 && i2.includes(e3);
    })) return false;
  }
  return !!Ae(e2, t2).ok;
}
function Te(e2) {
  const t2 = {};
  return e2.forEach(function(e3) {
    const n2 = function(e4) {
      const t3 = ge(e4 && e4.record ? e4.record.diagnoses : [])[0] || "حالات متنوعة", n3 = Ee(t3);
      return n3.includes("سكري") || n3.includes("diab") ? "مجموعة السكري" : n3.includes("قلب") || n3.includes("card") ? "مجموعة القلب" : n3.includes("سرطان") || n3.includes("oncology") ? "مجموعة الأورام" : n3.includes("ضغط") ? "مجموعة الضغط" : t3;
    }(e3);
    t2[n2] || (t2[n2] = []), t2[n2].push(e3);
  }), Object.keys(t2).map(function(e3) {
    return { name: e3, count: t2[e3].length, avgScore: Math.round(t2[e3].reduce(function(e4, t3) {
      return e4 + t3.score;
    }, 0) / t2[e3].length) };
  }).sort(function(e3, t3) {
    return t3.count - e3.count;
  });
}
function je(e2, t2) {
  const n2 = e2 && "object" == typeof e2 ? e2._source || e2 : {};
  return { record: { recordId: n2.recordId || n2.id || n2.objectID || `external-${Date.now()}-${t2}`, patient: n2.patient || { name: n2.patientName || n2.name || null, age: n2.age || null, gender: n2.gender || null, city: n2.city || null, hospital: n2.hospital || null }, encounter: n2.encounter || { date: n2.date || null, department: n2.department || null }, diagnoses: n2.diagnoses || n2.conditions || [], medications: n2.medications || [], alerts: n2.alerts || [], summary: n2.summary || { problem: n2.problem || "", plan: n2.plan || "" }, sourceHospital: n2.hospital || n2.hospitalName || null, savedAt: n2.savedAt || n2.updatedAt || null }, score: Math.min(100, Math.round(Number(e2._score || e2.relevanceScore || 50))), reasons: ["نتيجة مسترجعة من محرك البحث الخارجي"] };
}
async function Re(e2, t2) {
  const r2 = t2.filters || Ie(), a2 = t2.page || 1, o2 = xe(e2, j.records), i2 = o2.corrected || e2, s2 = we(i2), c2 = "off" === r2.semanticMode ? new Set(s2) : function(e3) {
    const t3 = new Set(e3);
    return e3.length ? (Object.keys(C).forEach(function(n2) {
      const r3 = [n2].concat(J(C[n2])).map(Ee);
      e3.some(function(e4) {
        return r3.some(function(t4) {
          return t4.includes(e4) || e4.includes(t4);
        });
      }) && r3.forEach(function(e4) {
        we(e4).forEach(function(e5) {
          t3.add(e5);
        });
      });
    }), t3) : t3;
  }(s2), u2 = ke(i2, r2, a2), l2 = function(e3) {
    const t3 = j.searchCache.get(e3);
    return t3 ? Date.now() - t3.timestamp > 3e5 ? (j.searchCache.delete(e3), null) : t3.value : null;
  }(u2);
  if (l2) return Object.assign({}, l2, { fromCache: true });
  const d2 = performance.now();
  let g2 = [], m2 = j.searchProvider || "local";
  try {
    "elasticsearch" === m2 ? g2 = await async function(e3, t3, r3) {
      if (!j.searchEndpoint || !j.searchIndex) throw new Error("إعداد Elasticsearch غير مكتمل.");
      const a3 = `${String(j.searchEndpoint).replace(/\/+$/, "")}/${encodeURIComponent(j.searchIndex)}/_search`, o3 = { from: 8 * (r3 - 1), size: 24, query: { bool: { must: [{ multi_match: { query: e3, fields: ["summary^3", "diagnoses^2", "patient.name^2", "medications.name", "alerts.message"] } }] } } }, i3 = { "Content-Type": "application/json" };
      j.searchApiKey && (i3.Authorization = j.searchApiKey.startsWith("ApiKey ") ? j.searchApiKey : `ApiKey ${j.searchApiKey}`);
      const s3 = await D(a3, { method: "POST", headers: i3, body: JSON.stringify(o3) }, n);
      if (!s3.ok) throw new Error("فشل استعلام Elasticsearch.");
      const c3 = await s3.json().catch(function() {
        return {};
      });
      return J(c3 && c3.hits && c3.hits.hits).map(function(e4, t4) {
        return je(e4, t4 + 1);
      }).filter(function(e4) {
        return Le(e4.record, t3);
      });
    }(i2, r2, a2) : "algolia" === m2 ? g2 = await async function(e3, t3, r3) {
      if (!(j.searchEndpoint && j.searchIndex && j.searchApiKey && j.searchAppId)) throw new Error("إعداد Algolia غير مكتمل.");
      const a3 = `${String(j.searchEndpoint).replace(/\/+$/, "")}/1/indexes/${encodeURIComponent(j.searchIndex)}/query`, o3 = { "Content-Type": "application/json", "X-Algolia-API-Key": j.searchApiKey, "X-Algolia-Application-Id": j.searchAppId }, i3 = { query: e3, hitsPerPage: 24, page: Math.max(0, r3 - 1), analytics: false, getRankingInfo: true }, s3 = await D(a3, { method: "POST", headers: o3, body: JSON.stringify(i3) }, n);
      if (!s3.ok) throw new Error("فشل استعلام Algolia.");
      const c3 = await s3.json().catch(function() {
        return {};
      });
      return J(c3 && c3.hits).map(function(e4, t4) {
        return je(e4, t4 + 1);
      }).filter(function(e4) {
        return Le(e4.record, t3);
      });
    }(i2, r2, a2) : m2 = "local";
  } catch (e3) {
    m2 = "local", Z(R.searchStatus, `فشل المحرك الخارجي، تم التحويل للمحرك المحلي. ${N(e3)}`, "error");
  }
  "local" === m2 && (g2 = j.records.map(function(e3) {
    return function(e4, t3, n2, r3, a3) {
      if (!Le(e4, a3)) return null;
      const o3 = Ee($e(e4)), i3 = [];
      let s3 = 0;
      t3 && o3.includes(Ee(t3)) && (s3 += 35, i3.push("تطابق نص الاستعلام بالكامل")), n2.forEach(function(e5) {
        o3.includes(e5) && (s3 += 14, i3.push(`تطابق مباشر: ${e5}`));
      }), r3.forEach(function(e5) {
        !n2.includes(e5) && o3.includes(e5) && (s3 += 8, i3.push(`تطابق دلالي: ${e5}`));
      });
      const c3 = ge(e4.diagnoses).join(" "), u3 = me(e4.medications).map(function(e5) {
        return e5.name;
      }).join(" "), l3 = Ee(c3), d3 = Ee(u3);
      n2.some(function(e5) {
        return l3.includes(e5);
      }) && (s3 += 12, i3.push("تطابق داخل التشخيصات")), n2.some(function(e5) {
        return d3.includes(e5);
      }) && (s3 += 9, i3.push("تطابق داخل الأدوية"));
      const g3 = ge(e4.alerts).filter(function(e5) {
        const t4 = Ee(e5);
        return t4.includes("خطر") || t4.includes("critical") || t4.includes("high");
      }).length;
      return g3 && (s3 += Math.min(16, 4 * g3)), s3 ? { record: e4, score: Math.min(100, Math.round(s3)), reasons: i3.slice(0, 5) } : null;
    }(e3, i2, s2, Array.from(c2), r2);
  }).filter(Boolean).sort(function(e3, t3) {
    if (t3.score !== e3.score) return t3.score - e3.score;
    const n2 = Be(e3.record && (e3.record.savedAt || e3.record.capturedAt) || 0) || 0;
    return (Be(t3.record && (t3.record.savedAt || t3.record.capturedAt) || 0) || 0) - n2;
  }));
  const p2 = Te(g2), h2 = function(e3, t3, n2) {
    const r3 = e3.length, a3 = Math.max(1, Math.ceil(r3 / n2)), o3 = Math.min(Math.max(1, t3), a3), i3 = (o3 - 1) * n2, s3 = i3 + n2;
    return { page: o3, pages: a3, rows: e3.slice(i3, s3), total: r3 };
  }(g2, a2, 8), f2 = function(e3) {
    const t3 = {}, n2 = {};
    e3.forEach(function(e4) {
      ge(e4.record && e4.record.diagnoses).forEach(function(e5) {
        const n3 = String(e5 || "").trim();
        n3 && (t3[n3] = (t3[n3] || 0) + 1);
      }), me(e4.record && e4.record.medications).forEach(function(e5) {
        const t4 = String(e5 && e5.name ? e5.name : "").trim();
        t4 && (n2[t4] = (n2[t4] || 0) + 1);
      });
    });
    const r3 = function(e4) {
      return Object.keys(e4).map(function(t4) {
        return { name: t4, count: e4[t4] };
      }).sort(function(e5, t4) {
        return t4.count - e5.count;
      }).slice(0, 8);
    };
    return { topDiagnoses: r3(t3), topMedications: r3(n2) };
  }(g2), v2 = { provider: m2, elapsedMs: Math.round(performance.now() - d2), query: i2, corrected: o2.changed ? i2 : "", totalMatches: h2.total, page: h2.page, pages: h2.pages, allRows: g2, rows: h2.rows, clusters: p2, aggregates: f2, fromCache: false };
  var y2, S2;
  return y2 = u2, S2 = v2, j.searchCache.set(y2, { timestamp: Date.now(), value: S2 }), v2;
}
function Pe(e2) {
  if (R.searchSuggestions) {
    if (!e2.length) return R.searchSuggestions.classList.remove("active"), void (R.searchSuggestions.innerHTML = "");
    R.searchSuggestions.classList.add("active"), R.searchSuggestions.innerHTML = e2.map(function(e3) {
      return `<button class="search-suggestion-item" type="button" data-suggest="${_(e3)}">${_(e3)}</button>`;
    }).join("");
  }
}
function qe(e2) {
  const t2 = Ee(e2);
  if (!t2 || t2.length < 2) return [];
  const n2 = /* @__PURE__ */ new Set();
  return j.searchSaved.forEach(function(e3) {
    e3 && "string" == typeof e3.query && Ee(e3.query).includes(t2) && n2.add(e3.query);
  }), j.records.forEach(function(e3) {
    const r2 = e3 && e3.patient ? e3.patient : {};
    [r2.name || "", r2.city || "", Ce(e3)].concat(ge(e3.diagnoses)).concat(me(e3.medications).map(function(e4) {
      return e4.name;
    })).forEach(function(e4) {
      const r3 = String(e4 || "").trim();
      r3 && Ee(r3).includes(t2) && n2.add(r3);
    });
  }), Array.from(n2).slice(0, 8);
}
function De(e2) {
  if (!R.searchStats) return;
  if (!e2) return void Z(R.searchStats, "إحصائيات البحث ستظهر هنا.", "");
  const t2 = e2.rows.length ? Math.round(e2.rows.reduce(function(e3, t3) {
    return e3 + t3.score;
  }, 0) / e2.rows.length) : 0, n2 = e2.elapsedMs <= 100 ? "أقل من 100ms" : `${e2.elapsedMs}ms`;
  Z(R.searchStats, `النتائج: ${e2.totalMatches} | الصفحة: ${e2.page}/${e2.pages} | متوسط الصلة: ${t2}% | المحرك: ${e2.provider} | السرعة: ${n2}${e2.fromCache ? " | من الكاش" : ""}`, e2.elapsedMs <= 100 ? "success" : "");
}
function Ne(e2, t2) {
  if (!R.searchClusters) return;
  const n2 = J(e2), r2 = n2.length ? n2.map(function(e3) {
    return `<li>${_(e3.name)} - ${_(String(e3.count))} حالة - متوسط صلة ${_(String(e3.avgScore))}%</li>`;
  }).join("") : "<li>لا توجد مجموعات حالياً.</li>", a2 = Se(t2 && t2.topDiagnoses), o2 = Se(t2 && t2.topMedications);
  R.searchClusters.innerHTML = `
  <div class="search-cluster-grid">
    <div class="result-item">
      <strong>تجميع النتائج</strong>
      <ul class="mini-list">${r2}</ul>
    </div>
    <div class="result-item">
      <strong>إحصائيات فورية</strong>
      <ul class="mini-list">${a2}</ul>
    </div>
  </div>
  <div class="result-item" style="margin-top:10px;">
    <strong>أكثر الأدوية في النتائج</strong>
    <ul class="mini-list">${o2}</ul>
  </div>
`;
}
async function Oe(e2) {
  const t2 = R.searchQuery ? R.searchQuery.value.trim() : "";
  if (!j.records.length) return void Z(R.searchStatus, "احفظ سجلاً واحداً على الأقل قبل البحث.", "error");
  if (!t2 || t2.length < 2) return void Z(R.searchStatus, "أدخل سؤال بحث واضح (حرفان على الأقل).", "error");
  G();
  const n2 = performance.now(), r2 = e2 && e2.page ? e2.page : j.searchCurrentPage;
  Z(R.searchStatus, "جاري تنفيذ البحث متعدد المستويات...", "");
  try {
    const e3 = await Re(t2, { page: r2, filters: Ie() });
    j.searchCurrentPage = e3.page, j.searchLastKey = ke(e3.query, Ie(), e3.page), j.searchLastAllResults = J(e3.allRows), j.searchLastPagedResults = J(e3.rows), function(e4) {
      if (!R.searchResult) return;
      if (!e4 || !Array.isArray(e4.rows)) return R.searchResult.innerHTML = "<p>لا توجد نتيجة للبحث.</p>", De(null), void Ne([], {});
      if (!e4.rows.length) return R.searchResult.innerHTML = "<p>لا توجد نتائج مطابقة للشروط الحالية.</p>", De(e4), void Ne(e4.clusters, e4.aggregates);
      const t3 = e4.rows.map(function(e5) {
        const t4 = e5.record || {}, n3 = t4.patient && "object" == typeof t4.patient ? t4.patient : {}, r3 = ge(t4.diagnoses)[0] || "بدون تشخيص واضح", a2 = J(e5.reasons).slice(0, 3).map(function(e6) {
          return `<li>${_(String(e6))}</li>`;
        }).join("");
        return `
    <div class="result-item" style="margin-top:10px;">
      <strong>${_(t4.recordId || "سجل")} - درجة الصلة: ${_(String(e5.score))}%</strong>
      <div>${_(n3.name || "مريض غير معروف")} | ${_(String(n3.age || "العمر غير متوفر"))} | ${_(n3.city || "بدون مدينة")}</div>
      <div>التشخيص: ${_(r3)}</div>
      <div>المستشفى: ${_(t4.sourceHospital || n3.hospital || "غير محدد")}</div>
      <ul class="mini-list" style="margin-top:6px;">${a2 || "<li>مطابقة دلالية</li>"}</ul>
    </div>
  `;
      }).join("");
      R.searchResult.innerHTML = `
  <div class="result-item">
    <strong>ملخص البحث</strong>
    <div>إجمالي النتائج المطابقة: ${_(String(e4.totalMatches))}</div>
    <div>الصفحة الحالية: ${_(String(e4.page))} من ${_(String(e4.pages))}</div>
    ${e4.corrected ? `<div>تصحيح إملائي مقترح: ${_(e4.corrected)}</div>` : ""}
  </div>
  ${t3}
`, De(e4), Ne(e4.clusters, e4.aggregates);
    }(e3), Z(R.searchStatus, `تم تنفيذ البحث بنجاح عبر محرك ${e3.provider}.`, "success"), at("search", { success: true, durationMs: Math.round(performance.now() - n2), provider: e3.provider, matches: e3.totalMatches });
  } catch (e3) {
    throw at("search", { success: false, durationMs: Math.round(performance.now() - n2), reason: String(e3 && e3.message ? e3.message : "error") }), e3;
  }
}
async function Fe() {
  X(R.searchBtn, true, "جاري البحث...");
  try {
    j.searchCurrentPage = 1, await Oe({ page: 1 });
  } catch (e2) {
    Z(R.searchStatus, N(e2, "تعذر تنفيذ البحث حالياً."), "error");
  } finally {
    X(R.searchBtn, false);
  }
}
function He() {
  const e2 = R.searchQuery ? R.searchQuery.value.trim() : "";
  Pe(qe(e2)), j.records.length ? !e2 || e2.length < 2 ? Z(R.searchQuickStatus, "اكتب حرفين على الأقل لتفعيل البحث الفوري.", "") : (j.searchTypingTimer && clearTimeout(j.searchTypingTimer), j.searchTypingTimer = setTimeout(function() {
    j.searchCurrentPage = 1, Oe({ page: 1 }).then(function() {
      Z(R.searchQuickStatus, "تم تحديث نتائج البحث الفوري أثناء الكتابة.", "success");
    }).catch(function(e3) {
      Z(R.searchQuickStatus, N(e3, "تعذر تنفيذ البحث الفوري."), "error");
    });
  }, 170)) : Z(R.searchQuickStatus, "احفظ سجلاً واحداً على الأقل لتفعيل البحث الفوري.", "");
}
function Qe(e2) {
  const t2 = e2.target;
  if (!t2 || !t2.getAttribute) return;
  const n2 = t2.getAttribute("data-suggest");
  n2 && R.searchQuery && (R.searchQuery.value = n2, Pe([]), Fe());
}
function Ke() {
  if (!R.savedSearchesSelect) return;
  const e2 = j.searchSaved.slice().reverse().slice(0, 40).map(function(e3, t2) {
    const n2 = `${e3.query} - ${e3.label || "بحث محفوظ"} (${e3.savedAt || ""})`;
    return `<option value="${_(String(t2))}">${_(n2)}</option>`;
  }).join("");
  R.savedSearchesSelect.innerHTML = `<option value="">استعلامات محفوظة</option>${e2}`;
}
function We() {
  const e2 = R.searchQuery ? R.searchQuery.value.trim() : "";
  if (!e2) return void Z(R.searchStatus, "أدخل استعلاماً أولاً ثم احفظه.", "error");
  const t2 = Ie(), n2 = { label: `استعلام ${j.searchSaved.length + 1}`, query: e2, filters: t2, provider: j.searchProvider, savedAt: (/* @__PURE__ */ new Date()).toLocaleString("ar-SA") };
  j.searchSaved.push(n2), j.searchSaved.length > 50 && (j.searchSaved = j.searchSaved.slice(-50)), F(s, JSON.stringify(j.searchSaved || [])), Ke(), Z(R.searchStatus, "تم حفظ الاستعلام بنجاح.", "success");
}
function Ge() {
  const e2 = R.savedSearchesSelect ? R.savedSearchesSelect.value : "";
  if ("" === e2) return void Z(R.searchStatus, "اختر استعلاماً محفوظاً أولاً.", "error");
  const t2 = j.searchSaved.slice().reverse().slice(0, 40)[Number(e2)];
  var n2;
  t2 ? (R.searchQuery && (R.searchQuery.value = t2.query || ""), (n2 = t2.filters || {}) && "object" == typeof n2 && (R.filterAgeMin && (R.filterAgeMin.value = null != n2.ageMin ? String(n2.ageMin) : ""), R.filterAgeMax && (R.filterAgeMax.value = null != n2.ageMax ? String(n2.ageMax) : ""), R.filterGender && (R.filterGender.value = n2.gender || ""), R.filterDateFrom && (R.filterDateFrom.value = n2.dateFrom ? new Date(n2.dateFrom).toISOString().slice(0, 10) : ""), R.filterDateTo && (R.filterDateTo.value = n2.dateTo ? new Date(n2.dateTo).toISOString().slice(0, 10) : ""), R.filterDepartment && (R.filterDepartment.value = n2.department || ""), R.filterExclude && (R.filterExclude.value = J(n2.excludeTerms).join("، ")), R.filterNearCity && (R.filterNearCity.value = n2.nearCity || ""), R.filterRadiusKm && (R.filterRadiusKm.value = n2.radiusKm ? String(n2.radiusKm) : ""), R.semanticMode && (R.semanticMode.value = n2.semanticMode || "on")), R.searchEngineProvider && t2.provider && (R.searchEngineProvider.value = t2.provider), j.searchCurrentPage = 1, Fe()) : Z(R.searchStatus, "تعذر تحميل الاستعلام المحدد.", "error");
}
function Ue() {
  j.searchCurrentPage <= 1 || (j.searchCurrentPage -= 1, Oe({ page: j.searchCurrentPage }).catch(function(e2) {
    Z(R.searchStatus, N(e2, "تعذر الانتقال للصفحة السابقة."), "error");
  }));
}
function ze() {
  j.searchCurrentPage += 1, Oe({ page: j.searchCurrentPage }).catch(function(e2) {
    j.searchCurrentPage = Math.max(1, j.searchCurrentPage - 1), Z(R.searchStatus, N(e2, "تعذر الانتقال للصفحة التالية."), "error");
  });
}
function _e() {
  j.searchCurrentPage = 1, Oe({ page: 1 }).catch(function(e2) {
    Z(R.searchStatus, N(e2, "تعذر تطبيق الفلاتر حالياً."), "error");
  });
}
function Je() {
  if (!j.searchLastAllResults.length) return void Z(R.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
  sn("medical-search-results.csv", "text/csv;charset=utf-8", function(e2) {
    const t2 = J(e2).map(function(e3) {
      const t3 = e3.record || {}, n2 = t3.patient || {}, r2 = ge(t3.diagnoses)[0] || "";
      return [t3.recordId || "", n2.name || "", null != n2.age ? String(n2.age) : "", n2.gender || "", n2.city || "", t3.sourceHospital || n2.hospital || "", r2, null != e3.score ? String(e3.score) : ""].map(an).join(",");
    });
    return `${["record_id", "patient_name", "age", "gender", "city", "hospital", "diagnosis", "relevance_score"].join(",")}
${t2.join("\n")}`;
  }(j.searchLastAllResults)), Z(R.searchStatus, "تم تصدير نتائج البحث CSV.", "success");
}
function Ze() {
  if (!j.searchLastAllResults.length) return void Z(R.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
  if (!window.XLSX) return void Z(R.searchStatus, "مكتبة Excel غير جاهزة حالياً.", "error");
  const e2 = j.searchLastAllResults.map(function(e3) {
    const t3 = e3.record || {}, n3 = t3.patient || {};
    return { "معرف السجل": t3.recordId || "", "اسم المريض": n3.name || "", "العمر": null != n3.age ? n3.age : "", "الجنس": n3.gender || "", "المدينة": n3.city || "", "المستشفى": t3.sourceHospital || n3.hospital || "", "التشخيص": ge(t3.diagnoses)[0] || "", "درجة الصلة": e3.score || 0 };
  }), t2 = window.XLSX.utils.json_to_sheet(e2), n2 = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(n2, t2, "SearchResults"), window.XLSX.writeFile(n2, "medical-search-results.xlsx"), Z(R.searchStatus, "تم تصدير نتائج البحث Excel.", "success");
}
function Xe() {
  if (!j.searchLastAllResults.length) return void Z(R.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
  if (!window.jspdf || !window.jspdf.jsPDF) return void Z(R.searchStatus, "مكتبة PDF غير جاهزة حالياً.", "error");
  const e2 = new (0, window.jspdf.jsPDF)({ unit: "pt", format: "a4" });
  let t2 = 40;
  e2.setFontSize(14), e2.text("نتائج البحث الطبي الذكي", 40, t2), t2 += 24, e2.setFontSize(10), j.searchLastAllResults.forEach(function(n2, r2) {
    const a2 = n2.record || {}, o2 = a2.patient || {}, i2 = `${r2 + 1}) ${a2.recordId || ""} | ${o2.name || ""} | ${ge(a2.diagnoses)[0] || ""} | ${n2.score || 0}%`;
    e2.text(i2.slice(0, 110), 40, t2), t2 += 16, t2 > 760 && (e2.addPage(), t2 = 40);
  }), e2.save("medical-search-results.pdf"), Z(R.searchStatus, "تم تصدير نتائج البحث PDF.", "success");
}
async function Ye() {
  const e2 = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!e2) return void Z(R.searchQuickStatus, "المتصفح لا يدعم الإدخال الصوتي المباشر. استخدم رفع ملف صوتي.", "error");
  if (j.voiceRecognitionActive && j.voiceRecognition) return void j.voiceRecognition.stop();
  const t2 = new e2();
  t2.lang = "ar-SA", t2.interimResults = false, t2.maxAlternatives = 1, j.voiceRecognition = t2, j.voiceRecognitionActive = true, Z(R.searchQuickStatus, "الاستماع جارٍ... تحدث الآن.", ""), t2.onresult = function(e3) {
    const t3 = e3 && e3.results && e3.results[0] && e3.results[0][0] ? String(e3.results[0][0].transcript || "").trim() : "";
    t3 && R.searchQuery && (R.searchQuery.value = t3, Z(R.searchQuickStatus, `تم تحويل الصوت إلى نص: ${t3}`, "success"), Fe());
  }, t2.onerror = function() {
    j.voiceRecognitionActive = false, Z(R.searchQuickStatus, "تعذر قراءة الصوت المباشر. استخدم رفع ملف صوتي.", "error");
  }, t2.onend = function() {
    j.voiceRecognitionActive = false, R.voiceSearchBtn && (R.voiceSearchBtn.textContent = "بحث صوتي مباشر");
  }, R.voiceSearchBtn && (R.voiceSearchBtn.textContent = "إيقاف البحث الصوتي"), t2.start();
}
function Ve() {
  R.voiceFileInput && R.voiceFileInput.click();
}
async function et(e2) {
  const r2 = e2 && e2.target && e2.target.files ? e2.target.files[0] : null;
  if (r2) {
    Z(R.searchQuickStatus, "جاري تحويل الملف الصوتي إلى نص...", "");
    try {
      const e3 = await Ct(r2), a2 = await ue(t, { fileBase64: e3, mimeType: r2.type || "audio/wav", fileName: r2.name }, Math.max(n, 9e4)), o2 = String(a2 && a2.text ? a2.text : "").trim();
      if (!o2) throw new Error("النص الناتج من الصوت فارغ.");
      R.searchQuery && (R.searchQuery.value = o2), Z(R.searchQuickStatus, "تم تحويل الصوت إلى نص بنجاح وتشغيل البحث.", "success"), await Fe();
    } catch (e3) {
      Z(R.searchQuickStatus, N(e3, "تعذر تنفيذ البحث الصوتي."), "error");
    } finally {
      e2 && e2.target && (e2.target.value = "");
    }
  }
}
function tt() {
  R.imageSearchInput && R.imageSearchInput.click();
}
async function nt(t2) {
  const r2 = t2 && t2.target && t2.target.files ? t2.target.files[0] : null;
  if (r2) {
    Z(R.searchQuickStatus, "جاري تحليل الصورة للبحث عن حالات مشابهة...", "");
    try {
      const t3 = await Ct(r2), a2 = await ue(e, { fileBase64: t3, mimeType: r2.type || "image/jpeg", fileName: r2.name }, Math.max(n, 6e4)), o2 = V(a2 && a2.text ? a2.text : "");
      if (!o2 || o2.length < 8) throw new Error("لم يتم استخراج نص كافٍ من الصورة.");
      R.searchQuery && (R.searchQuery.value = o2.slice(0, 180)), Z(R.searchQuickStatus, "تم استخراج النص من الصورة وتشغيل البحث الدلالي.", "success"), await Fe();
    } catch (e2) {
      Z(R.searchQuickStatus, N(e2, "تعذر تنفيذ البحث بالصورة."), "error");
    } finally {
      t2 && t2.target && (t2.target.value = "");
    }
  }
}

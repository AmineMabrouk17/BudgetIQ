"use client";

import { useState, useTransition } from "react";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import { computeBudgetTargets } from "@/lib/salary-planner";
import { saveSalaryPlanAction, clearAdvisorChatAction } from "@/app/actions/salary-planner";
import type { SalaryPlan, PlannerChatMessage } from "@/types/salary-planner";
import {
  ShieldAlert,
  Sparkles,
  TrendingUp,
  HeartHandshake,
  Bot,
  Send,
  Loader2,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

export default function SalaryPlannerView({ initialPlan }: { initialPlan: SalaryPlan }) {
  const format = useCurrencyFormatter();
  const [isPending, startTransition] = useTransition();

  const [salary, setSalary] = useState(initialPlan.monthly_salary);
  const [hasDependents, setHasDependents] = useState(initialPlan.has_dependents);

  // Actual values
  const [actuals, setActuals] = useState({
    essentials: initialPlan.actual_essentials,
    lifestyle: initialPlan.actual_lifestyle,
    emergencyFund: initialPlan.actual_emergency_fund,
    investments: initialPlan.actual_investments,
  });

  const [advice, setAdvice] = useState<string | null>(initialPlan.ai_advice ?? null);
  const [messages, setMessages] = useState<PlannerChatMessage[]>(initialPlan.chat_messages);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const targets = computeBudgetTargets(salary, hasDependents);

  // Percentages
  const essentialsPct = salary > 0 ? (actuals.essentials / salary) * 100 : 0;
  const lifestylePct = salary > 0 ? (actuals.lifestyle / salary) * 100 : 0;
  const investmentsPct = salary > 0 ? (actuals.investments / salary) * 100 : 0;
  const emergencyCoverage = targets.maxEssentials > 0 ? actuals.emergencyFund / targets.maxEssentials : 0;

  function handleSave() {
    startTransition(async () => {
      await saveSalaryPlanAction({
        monthly_salary: salary,
        has_dependents: hasDependents,
        actual_essentials: actuals.essentials,
        actual_lifestyle: actuals.lifestyle,
        actual_emergency_fund: actuals.emergencyFund,
        actual_investments: actuals.investments,
      });
    });
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isChatLoading) return;

    setChatInput("");
    setIsChatLoading(true);

    const tempUserMsg: PlannerChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/salary-planner/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          plan: {
            monthly_salary: salary,
            has_dependents: hasDependents,
            actual_essentials: actuals.essentials,
            actual_lifestyle: actuals.lifestyle,
            actual_emergency_fund: actuals.emergencyFund,
            actual_investments: actuals.investments,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to consult AI");

      const data = await res.json();
      setMessages(data.messages);
      if (data.adviceSummary) setAdvice(data.adviceSummary);
      if (data.updatedActuals) {
        setActuals({
          essentials: data.updatedActuals.actual_essentials,
          lifestyle: data.updatedActuals.actual_lifestyle,
          emergencyFund: data.updatedActuals.actual_emergency_fund,
          investments: data.updatedActuals.actual_investments,
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Salary Controls */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>مخطط الراتب الذكي</span>
                <span className="badge badge-primary badge-outline text-xs">قاعدة الـ 4 مسارات</span>
              </h1>
              <p className="text-sm text-base-content/70 mt-1">
                حدد راتبك الشهري لتوزيع ميزانيتك بحسب القواعد المالية وحافظ على استقرارك واستثمارك للمستقبل.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn btn-primary btn-sm self-start md:self-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              حفظ الخطة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-base-200">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">الراتب الشهري (Monthly Salary)</span>
              </label>
              <input
                type="number"
                min="0"
                value={salary || ""}
                onChange={(e) => setSalary(Number(e.target.value))}
                placeholder="أدخل راتبك الشهري (مثلاً 5000)"
                className="input input-bordered w-full font-bold text-lg"
              />
            </div>

            <div className="form-control justify-center">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={hasDependents}
                  onChange={(e) => setHasDependents(e.target.checked)}
                />
                <div>
                  <span className="label-text font-semibold">هل تعيل أسرة أو لديك التزامات عائلية؟</span>
                  <p className="text-xs text-base-content/60">
                    يرفع سقف صندوق الطوارئ من 3–6 أشهر إلى سنة كاملة (12 شهراً).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. الالتزامات الأساسية */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                1. الالتزامات الأساسية
              </span>
              <ShieldAlert className="h-5 w-5 text-warning" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black">{format(actuals.essentials)}</div>
              <div className="text-xs text-base-content/60 mt-0.5">
                الهدف: لا يتجاوز 60% ({format(targets.maxEssentials)})
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>النسبة الحالية:</span>
                <span className={essentialsPct > 60 ? "text-error font-bold" : "text-success font-bold"}>
                  {essentialsPct.toFixed(1)}%
                </span>
              </div>
              <progress
                className={`progress w-full ${essentialsPct > 60 ? "progress-error" : "progress-success"}`}
                value={Math.min(essentialsPct, 100)}
                max="100"
              />
            </div>
            <p className="text-[11px] text-base-content/60 mt-2">
              تشمل: إيجار البيت، أقساط السيارة، الفواتير، ومصاريف المعيشة الأساسية.
            </p>
          </div>
        </div>

        {/* 2. الكماليات ونمط الحياة */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                2. الكماليات ونمط الحياة
              </span>
              <HeartHandshake className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black">{format(actuals.lifestyle)}</div>
              <div className="text-xs text-base-content/60 mt-0.5">
                الهدف: لا يتجاوز 20% ({format(targets.maxLifestyle)})
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>النسبة الحالية:</span>
                <span className={lifestylePct > 20 ? "text-error font-bold" : "text-success font-bold"}>
                  {lifestylePct.toFixed(1)}%
                </span>
              </div>
              <progress
                className={`progress w-full ${lifestylePct > 20 ? "progress-error" : "progress-primary"}`}
                value={Math.min(lifestylePct, 100)}
                max="100"
              />
            </div>
            <p className="text-[11px] text-base-content/60 mt-2">
              تشمل: السفر، المطاعم، المقاهي، وتطبيقات التوصيل.
            </p>
          </div>
        </div>

        {/* 3. صندوق الطوارئ */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                3. صندوق الطوارئ
              </span>
              <Sparkles className="h-5 w-5 text-info" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black">{format(actuals.emergencyFund)}</div>
              <div className="text-xs text-base-content/60 mt-0.5">
                السقف المستهدف: {format(targets.targetEmergencyFundMax)}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>تغطية الأشهر:</span>
                <span className="font-bold text-info">
                  {emergencyCoverage.toFixed(1)} أشهر / {hasDependents ? "12 شهر" : "6 أشهر"}
                </span>
              </div>
              <progress
                className="progress progress-info w-full"
                value={Math.min(actuals.emergencyFund, targets.targetEmergencyFundMax)}
                max={targets.targetEmergencyFundMax || 1}
              />
            </div>
            <p className="text-[11px] text-base-content/60 mt-2">
              مخصص للأزمات غير المتوقعة (له سقف يتم التوقف عنده عند اكتماله).
            </p>
          </div>
        </div>

        {/* 4. الاستثمار والنمو */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                4. الاستثمار وبناء الثروة
              </span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-black">{format(actuals.investments)}</div>
              <div className="text-xs text-base-content/60 mt-0.5">
                الهدف: 10%–20%+ ({format(targets.targetInvestmentIdeal)})
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>النسبة الحالية:</span>
                <span className={investmentsPct >= 20 ? "text-success font-bold" : "text-base-content/80 font-bold"}>
                  {investmentsPct.toFixed(1)}%
                </span>
              </div>
              <progress
                className="progress progress-success w-full"
                value={Math.min(investmentsPct, 100)}
                max="100"
              />
            </div>
            <p className="text-[11px] text-base-content/60 mt-2">
              النسبة المتبقية؛ وكلما رفعتها كلما وصلت للاستقلال المالي أسرع.
            </p>
          </div>
        </div>
      </div>

      {/* AI Advice Summary Banner if available */}
      {advice && (
        <div className="alert alert-info shadow-sm flex items-start gap-3">
          <Bot className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-bold block mb-0.5">نصيحة المساعد المالي الذكي:</span>
            <span>{advice}</span>
          </div>
        </div>
      )}

      {/* Split section: Manual Adjustments & Interactive AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Manual Edit of Actual Values */}
        <div className="lg:col-span-4 card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h2 className="card-title text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              تعديل القيم الفعلية يدوياً
            </h2>
            <p className="text-xs text-base-content/60 mb-3">
              يمكنك كتابة أرقامك مباشرة أو إخبار الذكاء الاصطناعي بها ليصنفها نيابة عنك.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">الأساسيات (إيجار، فواتير، تموين)</label>
                <input
                  type="number"
                  min="0"
                  value={actuals.essentials || ""}
                  onChange={(e) => setActuals({ ...actuals, essentials: Number(e.target.value) })}
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">الكماليات (مطاعم، مقاهي، تطبيقات)</label>
                <input
                  type="number"
                  min="0"
                  value={actuals.lifestyle || ""}
                  onChange={(e) => setActuals({ ...actuals, lifestyle: Number(e.target.value) })}
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">المحفوظ في صندوق الطوارئ</label>
                <input
                  type="number"
                  min="0"
                  value={actuals.emergencyFund || ""}
                  onChange={(e) => setActuals({ ...actuals, emergencyFund: Number(e.target.value) })}
                  className="input input-sm input-bordered w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">الاستثمار الشهري الحالي</label>
                <input
                  type="number"
                  min="0"
                  value={actuals.investments || ""}
                  onChange={(e) => setActuals({ ...actuals, investments: Number(e.target.value) })}
                  className="input input-sm input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Financial Consultant Chat */}
        <div className="lg:col-span-8 card bg-base-100 border border-base-200 shadow-sm flex flex-col h-[520px]">
          <div className="p-4 border-b border-base-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-bold text-sm">مستشارك المالي الذكي (Gemini)</h2>
                <p className="text-[11px] text-base-content/60">
                  تحدث معه عن مصاريفك، وسيقوم بتوزيعها وإعطائك نصائح مقارنة بالأهداف
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => startTransition(async () => {
                  await clearAdvisorChatAction();
                  setMessages([]);
                  setAdvice(null);
                })}
                className="btn btn-ghost btn-xs text-error gap-1"
                title="مسح المحادثة"
              >
                <Trash2 className="h-3.5 w-3.5" />
                مسح
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-base-content/60">
                <Bot className="h-10 w-10 text-primary/40 mb-2" />
                <p className="text-sm font-semibold">مرحباً بك! أنا مستشارك المالي الذكي.</p>
                <p className="text-xs max-w-sm mt-1">
                  يمكنك أن تكتب لي مثلاً: &ldquo;أدفع 1800 إيجار، 400 فواتير، 600 مطاعم وتوصيل، ومعي 3000 ريال طوارئ&rdquo;.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat ${m.role === "user" ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble text-sm leading-relaxed ${
                      m.role === "user" ? "chat-bubble-primary" : "chat-bubble-neutral"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-neutral text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>جاري تحليل ميزانيتك ومقارنة الـ KPIs...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-base-200 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب تفاصيل مصاريفك أو استفسارك هنا..."
              className="input input-bordered input-sm flex-1"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="btn btn-primary btn-sm px-4"
            >
              {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
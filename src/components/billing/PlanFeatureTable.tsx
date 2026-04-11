import { planConfigs } from "@/lib/plans/config";

export function PlanFeatureTable() {
  const plans = Object.values(planConfigs);

  return (
    <section className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">方案差異</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-3 py-3 font-semibold">項目</th>
              {plans.map((plan) => (
                <th key={plan.key} className="px-3 py-3 font-semibold text-foreground">
                  {plan.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="名片數量" values={plans.map((plan) => (plan.maxCards >= 999 ? "不限" : `${plan.maxCards} 張`))} />
            <Row label="可用模板" values={plans.map((plan) => (plan.allowedTemplates === "all" ? "全部" : `${plan.allowedTemplates} 款`))} />
            <Row label="移除浮水印" values={plans.map((plan) => (plan.removeWatermark ? "Yes" : "No"))} />
            <Row label="進階分享" values={plans.map((plan) => (plan.advancedShare ? "Yes" : "No"))} />
            <Row label="自訂網址" values={plans.map((plan) => (plan.customSlug ? "Yes" : "No"))} />
            <Row label="Priority Support" values={plans.map((plan) => (plan.prioritySupport ? "Yes" : "No"))} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-3 py-3 font-medium text-foreground">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="px-3 py-3 text-muted">
          {value}
        </td>
      ))}
    </tr>
  );
}

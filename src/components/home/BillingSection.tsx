import { cn } from '@/lib/utils'
import { ArrowUpRight, Palmtree, PlusCircle, FastForward } from 'lucide-react'

function getRuleIcon(key: string) {
  switch (key) {
    case 'skip': return <FastForward className="w-5 h-5 text-red-500" />
    case 'vacation': return <Palmtree className="w-5 h-5 text-blue-500" />
    case 'extra': return <PlusCircle className="w-5 h-5 text-green-500" />
    case 'carryforward': return <ArrowUpRight className="w-5 h-5 text-amber-500" />
    default: return null
  }
}

const billingRows = [
  { label: 'Base Subscription (30 days × ₹82.67)', value: '₹2,480.00', type: 'base' },
  { label: 'Skip Credits (3 days × ₹82.67)', value: '−₹248.01', type: 'credit' },
  { label: 'Vacation Credit (June 10–12, 3 days)', value: '−₹248.01', type: 'credit' },
  { label: 'Extra Milk (June 20, +1L)', value: '+₹82.67', type: 'extra' },
  { label: 'Credit from May Bill', value: '−₹82.67', type: 'credit' },
]

const rules = [
  {
    color: 'border-red-400',
    iconKey: 'skip',
    title: 'Skip Credits',
    body: 'Skip any day before 9 PM. Daily rate is credited to your next bill automatically. No hassle, no negotiations.',
  },
  {
    color: 'border-blue-400',
    iconKey: 'vacation',
    title: 'Vacation Credits',
    body: 'Pause for any number of days. Total credits calculated and applied to your next month\'s bill in full.',
  },
  {
    color: 'border-green-400',
    iconKey: 'extra',
    title: 'Extra Charges',
    body: 'Order extra milk anytime. Charges are added to the following month\'s bill at the same daily rate.',
  },
  {
    color: 'border-amber-400',
    iconKey: 'carryforward',
    title: 'Monthly Carryforward',
    body: 'If you have unused credit, it carries to next month automatically. Never lose what you\'ve saved.',
  },
]

export function BillingSection() {
  const netPayable = 2480 - 248.01 - 248.01 + 82.67 - 82.67
  const carryNext = 248.01 + 248.01 - 82.67 + 82.67

  return (
    <section className="bg-milk-50 section-py" id="billing">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <p className="section-label justify-center">Transparent Billing</p>
          <h2 className="text-heading text-teal-900 mb-4">
            Every rupee, clearly explained
          </h2>
          <p className="text-body text-teal-900/55">
            No more manual calculations. No more disputes. Every customer sees exactly how their bill is computed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Billing statement card */}
          <div className="bg-white rounded-[28px] shadow-card overflow-hidden border border-milk-200">
            {/* Header */}
            <div className="bg-teal-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tiny text-white/60 uppercase tracking-widest mb-1">Billing Statement</p>
                  <p className="text-subhead font-bold text-white">June 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-tiny text-white/60">Ravi Nayak</p>
                  <p className="text-xs text-white/80">1 Litre/day</p>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-milk-100">
              {billingRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-8 py-4">
                  <span className="text-small text-teal-900/60 leading-snug max-w-[60%]">
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      'text-small font-bold font-mono-num',
                      row.type === 'credit' && 'text-green-600',
                      row.type === 'extra' && 'text-amber-600',
                      row.type === 'base' && 'text-teal-900',
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="px-8 py-5 border-t-2 border-teal-700/10 flex items-center justify-between bg-milk-50">
              <div>
                <p className="text-small text-teal-900/55 mb-0.5">Net Payable This Month</p>
                <p className="text-tiny text-teal-500">Due by June 30, 2026</p>
              </div>
              <p className="text-heading font-extrabold text-teal-700 font-mono-num">
                ₹{netPayable.toFixed(2)}
              </p>
            </div>

            {/* Carry forward */}
            <div className="bg-teal-50 border-t border-teal-100 px-8 py-4 flex items-center justify-between">
              <p className="text-small text-teal-700 font-semibold">
                Credit carried to July bill
              </p>
              <p className="text-small font-bold text-teal-700 font-mono-num">
                ₹{carryNext.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-4">
            <h3 className="text-subhead font-bold text-teal-900 mb-2">
              How billing works
            </h3>
            {rules.map((rule) => (
              <div
                key={rule.title}
                className={cn(
                  'bg-white rounded-[18px] border border-milk-200 border-l-4 p-6',
                  rule.color,
                  'transition-transform duration-200 hover:translate-x-1'
                )}
              >
                <h4 className="text-small font-bold text-teal-900 mb-2 flex items-center gap-2">
                  {getRuleIcon(rule.iconKey)}
                  {rule.title}
                </h4>
                <p className="text-small text-teal-900/55 leading-relaxed">{rule.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

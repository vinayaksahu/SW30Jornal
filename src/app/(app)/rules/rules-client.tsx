'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RuleCategory, RuleStatus } from '@/types/enums'
import { toggleRule, deleteRule, createRule } from '@/actions/rules'

type Account = { id: string; name: string; propFirm: string }
type Rule = {
  id: string
  name: string
  description: string | null
  category: string
  ruleType: string
  config: any
  status: string
  _count: { ruleViolations: number }
}

export default function RulesClient({
  accounts,
  initialRules,
  selectedAccountId
}: {
  accounts: Account[]
  initialRules: Rule[]
  selectedAccountId: string
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<'ALL' | 'ACCOUNT' | 'TRADING'>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const rules = initialRules.filter(r => filter === 'ALL' || r.category === filter)

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    await toggleRule(id, newStatus as RuleStatus)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    await deleteRule(id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-zinc-300">Account:</label>
          <select 
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
            value={selectedAccountId}
            onChange={(e) => router.push(`/rules?accountId=${e.target.value}`)}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.propFirm})</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          Add Custom Rule
        </button>
      </div>

      <div className="flex space-x-2 border-b border-zinc-800 pb-2">
        {(['ALL', 'ACCOUNT', 'TRADING'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'ALL' ? 'All Rules' : `${tab} Rules`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {rules.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No rules found for this category.
          </div>
        )}
        {rules.map(rule => (
          <div key={rule.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col h-full relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="inline-block px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded mb-2">
                  {rule.category}
                </span>
                <h3 className="text-lg font-bold text-zinc-100">{rule.name}</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={rule.status === 'ENABLED'}
                  onChange={() => handleToggle(rule.id, rule.status)}
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <p className="text-sm text-zinc-400 mb-4 flex-1">
              {rule.description || 'No description provided.'}
            </p>
            
            <div className="bg-zinc-950 rounded p-3 mb-4 text-xs font-mono text-zinc-400 overflow-x-auto">
              {JSON.stringify(rule.config)}
            </div>

            <div className="flex justify-between items-center mt-auto border-t border-zinc-800 pt-3">
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                rule._count.ruleViolations > 0 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
              }`}>
                {rule._count.ruleViolations} Violations
              </span>
              <button 
                onClick={() => handleDelete(rule.id)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <CreateRuleModal 
          accountId={selectedAccountId} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}

function CreateRuleModal({ accountId, onClose }: { accountId: string, onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'TRADING' as RuleCategory,
    ruleType: 'CUSTOM',
    configStr: '{\n  \n}'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let config = {}
      try {
        config = JSON.parse(formData.configStr)
      } catch (err) {
        alert('Invalid JSON in config')
        setLoading(false)
        return
      }

      await createRule(accountId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        ruleType: formData.ruleType,
        config,
        status: 'ENABLED'
      })
      onClose()
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Error creating rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Add Custom Rule</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
            <input 
              required
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
            <input 
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Category</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as RuleCategory})}
              >
                <option value="TRADING">Trading</option>
                <option value="ACCOUNT">Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm"
                value={formData.ruleType}
                onChange={e => setFormData({...formData, ruleType: e.target.value})}
              >
                <option value="MAX_RISK_PER_TRADE">Max Risk / Trade</option>
                <option value="MAX_LOT_SIZE">Max Lot Size</option>
                <option value="MIN_RR">Min RR</option>
                <option value="REQUIRED_STOP_LOSS">Required SL</option>
                <option value="REQUIRED_TAKE_PROFIT">Required TP</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Config (JSON)</label>
            <textarea 
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-sm font-mono"
              value={formData.configStr}
              onChange={e => setFormData({...formData, configStr: e.target.value})}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

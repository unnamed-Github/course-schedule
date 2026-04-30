'use client'

import { Plus } from 'lucide-react'
import type { MakeupDay } from '@/lib/semester'

interface MakeupDayEditorProps {
  makeupDays: MakeupDay[]
  editingIdx: number | null
  setEditingIdx: (idx: number | null) => void
  form: MakeupDay
  setForm: (f: MakeupDay) => void
  onSave: (makeups: MakeupDay[]) => void
}

export function MakeupDayEditor({
  makeupDays,
  editingIdx,
  setEditingIdx,
  form,
  setForm,
  onSave,
}: MakeupDayEditorProps) {
  return (
    <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-light)' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>调休日</h4>
        <button
          onClick={() => { setForm({ date: '', replacesDayOfWeek: 1, weekType: 'all' }); setEditingIdx(-1) }}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <Plus size={12} strokeWidth={2} />添加
        </button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {makeupDays.map((m, i) =>
          editingIdx === i ? (
            <MakeupEditForm
              key={i}
              form={form}
              setForm={setForm}
              onSave={(updated) => {
                const next = [...makeupDays]
                if (editingIdx === -1) next.push(updated)
                else next[editingIdx] = updated
                onSave(next)
              }}
              onCancel={() => setEditingIdx(null)}
            />
          ) : (
            <div key={i} className="flex items-center justify-between text-xs py-0.5" style={{ color: 'var(--text-secondary)' }}>
              <span>{m.date} 补周{m.replacesDayOfWeek} · {m.weekType === 'odd' ? '单周' : m.weekType === 'even' ? '双周' : '每周'}</span>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ ...m }); setEditingIdx(i) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                <button onClick={() => onSave(makeupDays.filter((_, j) => j !== i))} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
              </div>
            </div>
          )
        )}
        {editingIdx === -1 && (
          <MakeupEditForm
            form={form}
            setForm={setForm}
            onSave={(updated) => onSave([...makeupDays, updated])}
            onCancel={() => setEditingIdx(null)}
          />
        )}
      </div>
    </div>
  )
}

function MakeupEditForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: MakeupDay
  setForm: (f: MakeupDay) => void
  onSave: (m: MakeupDay) => void
  onCancel: () => void
}) {
  return (
    <div className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        className="w-full rounded-lg px-2 py-1 text-xs"
        style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
      />
      <div className="flex gap-2">
        <select
          value={form.replacesDayOfWeek}
          onChange={(e) => setForm({ ...form, replacesDayOfWeek: parseInt(e.target.value) })}
          className="flex-1 rounded-lg px-2 py-1 text-xs"
          style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
        >
          {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>补周{d}</option>)}
        </select>
        <select
          value={form.weekType}
          onChange={(e) => setForm({ ...form, weekType: e.target.value as 'all' | 'odd' | 'even' })}
          className="flex-1 rounded-lg px-2 py-1 text-xs"
          style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
        >
          <option value="all">每周</option>
          <option value="odd">单周</option>
          <option value="even">双周</option>
        </select>
      </div>
      <div className="flex gap-1 justify-end">
        <button
          onClick={() => { if (!form.date) return; onSave(form) }}
          className="btn-ghost text-xs"
          style={{ color: 'var(--accent-info)' }}
        >保存</button>
        <button onClick={onCancel} className="btn-ghost text-xs">取消</button>
      </div>
    </div>
  )
}

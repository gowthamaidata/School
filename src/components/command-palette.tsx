'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { repo } from '@/lib/data/repository'
import type { Student, ClassSection } from '@/lib/data/types'

export interface CommandItem {
  id: string
  label: string
  hint?: string
  group: string
  icon?: React.ReactNode
  run: () => void
  keywords?: string
}

/**
 * ⌘K / Ctrl-K palette.
 *
 * Two jobs, both of which a school user does constantly: jump to a section of
 * the app, and find one student by name or admission number without first
 * navigating to the directory and filtering it. Students are loaded once when
 * the palette first opens, not on every keystroke — a 500-student roster
 * filters instantly in memory and never touches the network again.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  canSeeStudents,
  placeholder = 'Search or jump to…',
}: {
  open: boolean
  onClose: () => void
  commands: CommandItem[]
  canSeeStudents: boolean
  placeholder?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!open || !canSeeStudents || loadedRef.current) return
    loadedRef.current = true
    Promise.all([repo.getStudents(), repo.getSections()]).then(([s, sec]) => {
      setStudents(s)
      setSections(sec)
    })
  }, [open, canSeeStudents])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const sectionLabel = useCallback(
    (id: string) => sections.find((s) => s.id === id)?.label ?? '',
    [sections],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const nav = commands.filter(
      (c) =>
        !q ||
        c.label.toLowerCase().includes(q) ||
        (c.keywords ?? '').toLowerCase().includes(q),
    )
    const people: CommandItem[] =
      q.length >= 2 && canSeeStudents
        ? students
            .filter(
              (s) =>
                s.name.toLowerCase().includes(q) ||
                s.name_ta.includes(query.trim()) ||
                s.admission_no.toLowerCase().includes(q),
            )
            .slice(0, 6)
            .map((s) => ({
              id: `student-${s.id}`,
              label: s.name,
              hint: `${s.admission_no} · Class ${sectionLabel(s.section_id)}`,
              group: 'Students',
              icon: <User size={15} />,
              run: () => router.push(`/students/${s.id}`),
            }))
        : []
    return [...nav, ...people]
  }, [query, commands, students, canSeeStudents, router, sectionLabel])

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const groups = results.reduce<Record<string, CommandItem[]>>((acc, item) => {
    ;(acc[item.group] ??= []).push(item)
    return acc
  }, {})

  function choose(item: CommandItem) {
    onClose()
    item.run()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[active]
      if (item) choose(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  let index = -1

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-ink/35 backdrop-blur-xs" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        className="relative z-10 w-full max-w-lg animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-2xs text-ink-3 sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="thin-scroll max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-3">
              Nothing matches “{query}”.
            </p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <div className="label px-3 py-1.5">{group}</div>
                {items.map((item) => {
                  index += 1
                  const isActive = index === active
                  const myIndex = index
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onMouseMove={() => setActive(myIndex)}
                      onClick={() => choose(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                        isActive ? 'bg-surface-2 text-ink' : 'text-ink-2',
                      )}
                    >
                      <span className={cn('shrink-0', isActive ? 'text-forest' : 'text-ink-3')}>
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        {item.hint && (
                          <span className="block truncate text-xs text-ink-3">{item.hint}</span>
                        )}
                      </span>
                      {isActive && <CornerDownLeft size={14} className="shrink-0 text-ink-3" aria-hidden />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/** Registers the ⌘K / Ctrl-K shortcut and returns palette open state. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return { open, setOpen }
}

'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import type { WellField } from './DraggableField'

interface Props { field: WellField; wellName: string; onRemove: () => void }

export default function SortableFieldChip({ field, wellName, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `well::${wellName}::${field.column}`, data: { field, origin: wellName },
  })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 5,
        fontSize: 11, fontWeight: 600, background: '#097cf7', color: '#fff', cursor: 'grab',
      }} {...listeners} {...attributes}>
        <span style={{ flex: 1 }}>{field.label}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', lineHeight: 1 }}><X size={11} /></button>
      </div>
    </div>
  )
}

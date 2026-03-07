import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { PROFILE_QUESTIONS_GROUPED } from '@/lib/constants';

interface Props {
    value: string;
    onChange: (value: string) => void;
    otherSelected: string[];
}

export default function PromptDropdown({ value, onChange, otherSelected }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-transparent border-none py-[0.875rem] pr-[1.5rem] pl-0 text-left outline-none cursor-pointer"
                style={{
                    fontFamily: 'var(--font-body), Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '0.9375rem',
                    color: value ? 'var(--color-ink)' : 'var(--color-text-muted)',
                }}
            >
                <span className="pr-4 block w-full">{value || 'Choose a prompt…'}</span>
                <ChevronDown
                    size={16}
                    className={`absolute right-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 w-[calc(100%+2.5rem)] -left-[1.25rem] top-[calc(100%+0.5rem)] bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#e5ddd0] overflow-hidden max-h-[60vh] flex flex-col transform origin-top animate-fade-in-up"
                >
                    <div className="overflow-y-auto p-2" style={{ maxHeight: '400px', WebkitOverflowScrolling: 'touch' }}>
                        {PROFILE_QUESTIONS_GROUPED.map((group) => {
                            const availableQuestions = group.questions.filter(
                                (q) => !otherSelected.includes(q) || q === value
                            );

                            if (availableQuestions.length === 0) return null;

                            return (
                                <div key={group.group} className="mb-2 last:mb-0">
                                    <div className="px-3 py-2 text-[0.6875rem] font-bold text-[#8c8273] uppercase tracking-wider font-mono sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                                        {group.group}
                                    </div>
                                    <div className="space-y-0.5">
                                        {availableQuestions.map((q) => (
                                            <button
                                                key={q}
                                                type="button"
                                                onClick={() => {
                                                    onChange(q);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-start gap-2.5 ${value === q
                                                    ? 'bg-[#f0f4f8] text-[var(--color-columbia)] font-medium'
                                                    : 'text-[#2f2a24] hover:bg-[#f9f7f4]'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.4 }}
                                            >
                                                {value === q ? (
                                                    <Check size={16} className="shrink-0 mt-[2px] text-[var(--color-columbia)]" />
                                                ) : (
                                                    <div className="w-4 shrink-0" />
                                                )}
                                                <span className="flex-1">{q}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';

export default function CreateInternshipForm() {
    const router = useRouter();
    const { token } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        locationCity: '',
        locationState: '',
        locationCountry: 'India',
        workMode: 'REMOTE',
        stipendAmount: '',
        stipendCurrency: 'INR',
        durationMonth: '',
        skills: ''
    });

    const [skillTags, setSkillTags] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === ',' || e.key === 'Enter') && skillInput.trim()) {
            e.preventDefault();
            const tag = skillInput.trim().replace(/,$/, '');
            if (tag && !skillTags.includes(tag)) {
                setSkillTags([...skillTags, tag]);
            }
            setSkillInput('');
        } else if (e.key === 'Backspace' && !skillInput && skillTags.length > 0) {
            setSkillTags(skillTags.slice(0, -1));
        }
    };

    const removeSkill = (index: number) => {
        setSkillTags(skillTags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const allSkills = [...skillTags];
            if (skillInput.trim()) allSkills.push(skillInput.trim());

            const payload = {
                ...formData,
                stipendAmount: formData.stipendAmount ? parseFloat(formData.stipendAmount) : null,
                durationMonth: formData.durationMonth ? parseInt(formData.durationMonth) : null,
                skills: allSkills.length > 0 ? allSkills : formData.skills.split(',').map(s => s.trim()).filter(Boolean)
            };

            await api.createInternship(token!, payload);
            toast.success('Internship posted successfully!');
            router.push('/provider/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create internship');
            toast.error(err.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-sm";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg max-w-2xl mx-auto overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-6">
                <h1 className="text-2xl font-bold text-white">Post New Internship</h1>
                <p className="text-primary-100 mt-1 text-sm">Fill in the details to publish your internship opportunity.</p>
            </div>

            <div className="p-8 space-y-8">
                {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {/* Section 1: Basic Info */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-sm">📋</span>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Basic Information</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Title</label>
                            <input type="text" name="title" required value={formData.title} onChange={handleChange} className={inputClasses} placeholder="e.g. Software Engineering Intern" />
                        </div>
                        <div>
                            <label className={labelClasses}>Description</label>
                            <textarea name="description" required rows={4} value={formData.description} onChange={handleChange} className={`${inputClasses} resize-none`} placeholder="Describe the role and responsibilities..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Category</label>
                                <select name="category" required value={formData.category} onChange={handleChange} className={inputClasses}>
                                    <option value="">Select Category</option>
                                    <option value="Software Engineering">Software Engineering</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Product">Product</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Work Mode</label>
                                <select name="workMode" required value={formData.workMode} onChange={handleChange} className={inputClasses}>
                                    <option value="REMOTE">Remote</option>
                                    <option value="ONSITE">Onsite</option>
                                    <option value="HYBRID">Hybrid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* Section 2: Location */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm">📍</span>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Location</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClasses}>City</label>
                            <input type="text" name="locationCity" required value={formData.locationCity} onChange={handleChange} className={inputClasses} placeholder="Bangalore" />
                        </div>
                        <div>
                            <label className={labelClasses}>State</label>
                            <input type="text" name="locationState" required value={formData.locationState} onChange={handleChange} className={inputClasses} placeholder="Karnataka" />
                        </div>
                        <div>
                            <label className={labelClasses}>Country</label>
                            <input type="text" name="locationCountry" required value={formData.locationCountry} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                </section>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* Section 3: Compensation */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-sm">💰</span>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Compensation & Duration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Stipend (Monthly)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input type="number" name="stipendAmount" required min="0" value={formData.stipendAmount} onChange={handleChange} className={`${inputClasses} pl-8`} placeholder="15000" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Duration (Months)</label>
                            <input type="number" name="durationMonth" required min="1" max="24" value={formData.durationMonth} onChange={handleChange} className={inputClasses} placeholder="3" />
                        </div>
                    </div>
                </section>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* Section 4: Skills */}
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-sm">🏷️</span>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Required Skills</h2>
                    </div>
                    <div>
                        <label className={labelClasses}>Skills</label>
                        <div className={`${inputClasses} flex flex-wrap gap-2 min-h-[48px] items-center cursor-text`} onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                            {skillTags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
                                    {tag}
                                    <button type="button" onClick={() => removeSkill(i)} className="text-primary-400 hover:text-primary-600 ml-0.5">×</button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder={skillTags.length === 0 ? "Type a skill and press comma or enter..." : "Add more..."}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Press comma or enter to add each skill</p>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 text-sm">
                        {loading ? 'Publishing...' : 'Publish Internship 🚀'}
                    </button>
                </div>
            </div>
        </form>
    );
}

import { useMemo, useState } from 'react';
import { Button, Card, Input } from './ui';
import './CertificationPredictorForm.css';

const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/predict-certification`;

const initialForm = {
    attendance_rate: '',
    missed_sessions: '',
    levels_completed: '',
    avg_quiz_score: '',
    engagement_score: '',
};

function toNumber(value) {
    const trimmed = String(value ?? '').trim();
    if (trimmed === '') return null;
    const normalized = trimmed.replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
}

function formatPercent(probability) {
    if (typeof probability !== 'number' || !Number.isFinite(probability)) return '—';
    return `${(probability * 100).toFixed(1)}%`;
}

export default function CertificationPredictorForm() {
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [result, setResult] = useState(null); // { certified: 0|1, probability: number }

    const fieldDefs = useMemo(
        () => [
            {
                name: 'attendance_rate',
                label: 'Attendance rate',
                placeholder: '0–1 (or 0–100 for %)',
                step: '0.01',
            },
            {
                name: 'missed_sessions',
                label: 'Missed sessions',
                placeholder: 'e.g. 2',
                step: '1',
            },
            {
                name: 'levels_completed',
                label: 'Levels completed',
                placeholder: 'e.g. 5',
                step: '1',
            },
            {
                name: 'avg_quiz_score',
                label: 'Average quiz score',
                placeholder: 'e.g. 78',
                step: '0.1',
            },
            {
                name: 'engagement_score',
                label: 'Engagement score',
                placeholder: '0–1 (or 0–100)',
                step: '0.01',
            },
        ],
        []
    );

    const clientErrors = useMemo(() => {
        const errors = {};
        for (const def of fieldDefs) {
            const num = toNumber(form[def.name]);
            if (num === null) errors[def.name] = 'Required';
        }
        return errors;
    }, [fieldDefs, form]);

    const canSubmit = !submitting && Object.keys(clientErrors).length === 0;

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setApiError('');
    };

    const onReset = () => {
        setForm(initialForm);
        setApiError('');
        setResult(null);
    };

    const onFillExample = () => {
        setForm({
            attendance_rate: '0.92',
            missed_sessions: '2',
            levels_completed: '5',
            avg_quiz_score: '78',
            engagement_score: '0.81',
        });
        setApiError('');
        setResult(null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setResult(null);

        if (!canSubmit) {
            setApiError('Please fill all fields with valid numbers.');
            return;
        }

        const payload = {
            attendance_rate: toNumber(form.attendance_rate),
            missed_sessions: toNumber(form.missed_sessions),
            levels_completed: toNumber(form.levels_completed),
            avg_quiz_score: toNumber(form.avg_quiz_score),
            engagement_score: toNumber(form.engagement_score),
        };

        setSubmitting(true);
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : null;

            if (!res.ok) {
                let message = data?.error?.message || `Request failed (${res.status})`;
                if (res.status === 404) {
                    message = `Request failed (404). Check that the Flask ML API is running and that VITE_ML_API_URL points to it (current: ${API_BASE_URL}).`;
                }
                throw new Error(message);
            }

            const certified = Number(data?.certified);
            const probability = Number(data?.probability);

            if (![0, 1].includes(certified) || !Number.isFinite(probability)) {
                throw new Error('Unexpected API response format.');
            }

            setResult({ certified, probability });
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="ml-card">
            <div className="ml-header">
                <h2 className="ml-title">Certification Predictor</h2>
                <p className="ml-subtitle">Enter student signals to predict certification.</p>
            </div>

            <form className="ml-form" onSubmit={onSubmit}>
                <div className="ml-grid">
                    {fieldDefs.map((def) => (
                        <Input
                            key={def.name}
                            label={def.label}
                            type="number"
                            name={def.name}
                            value={form[def.name]}
                            onChange={onChange}
                            placeholder={def.placeholder}
                            step={def.step}
                            required
                            disabled={submitting}
                            error={apiError ? '' : clientErrors[def.name]}
                        />
                    ))}
                </div>

                {apiError && (
                    <div className="ml-alert" role="alert" aria-live="polite">
                        {apiError}
                    </div>
                )}

                <div className="ml-actions">
                    <Button type="submit" loading={submitting} disabled={!canSubmit}>
                        Predict certification
                    </Button>
                    
                    <Button type="button" variant="ghost" onClick={onReset} disabled={submitting}>
                        Reset
                    </Button>
                </div>

                {result && (
                    <div className={`ml-result ${result.certified === 1 ? 'ml-ok' : 'ml-no'}`}>
                        <div className="ml-result-row">
                            <span className="ml-result-label">Result</span>
                            <span className="ml-result-value">
                                {result.certified === 1 ? 'Certified' : 'Not Certified'}
                            </span>
                        </div>
                        <div className="ml-result-row">
                            <span className="ml-result-label">Probability</span>
                            <span className="ml-result-value">{formatPercent(result.probability)}</span>
                        </div>
                    </div>
                )}
            </form>
        </Card>
    );
}

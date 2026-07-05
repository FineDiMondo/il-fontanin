import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import api from '../api/client.js'
import { showToast } from '../components/Toast.jsx'
import ToastContainer from '../components/Toast.jsx'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'

function SurveyForm({ survey, onDone, t }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function setAnswer(qid, val) {
    setAnswers(a => ({ ...a, [qid]: val }))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(`/research/surveys/${survey.id}/responses`, { risposte: answers })
      showToast(`${t('research.response_sent')}, ${t('research.thanks')}`, 'success')
      onDone()
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Errore nell\'invio')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-sm font-medium text-stone-700">{survey.titolo}</h3>
      {(survey.domande_json || []).map(d => (
        <div key={d.id} className="stone-card space-y-2">
          <p className="text-sm text-stone-700">{d.testo}</p>

          {d.tipo === 'testo' && (
            <textarea
              className="w-full text-sm border border-pietra-border rounded-xl px-3 py-2 bg-pietra-pale focus:outline-none focus:ring-1 focus:ring-oro-muted resize-none"
              rows={3}
              placeholder={t('research.answer_ph')}
              onChange={e => setAnswer(d.id, e.target.value)}
            />
          )}

          {d.tipo === 'scelta_singola' && (d.opzioni || []).map(opt => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name={d.id}
                value={opt}
                onChange={() => setAnswer(d.id, opt)}
                className="accent-noce w-4 h-4"
              />
              <span className="text-sm text-stone-600">{opt}</span>
            </label>
          ))}

          {d.tipo === 'scelta_multipla' && (d.opzioni || []).map(opt => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                value={opt}
                onChange={e => {
                  const curr = answers[d.id] || []
                  setAnswer(d.id, e.target.checked ? [...curr, opt] : curr.filter(v => v !== opt))
                }}
                className="accent-noce w-4 h-4"
              />
              <span className="text-sm text-stone-600">{opt}</span>
            </label>
          ))}

          {d.tipo === 'scala' && (
            <div className="space-y-1">
              <input
                type="range"
                min={d.scala_min || 1}
                max={d.scala_max || 10}
                defaultValue={Math.round(((d.scala_min || 1) + (d.scala_max || 10)) / 2)}
                onChange={e => setAnswer(d.id, Number(e.target.value))}
                className="w-full accent-noce"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>{d.scala_min || 1}</span>
                <span className="text-stone-600 font-medium">{answers[d.id] ?? '—'}</span>
                <span>{d.scala_max || 10}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-noce text-oro py-3.5 rounded-2xl font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {submitting ? t('common.sending') : t('research.submit')}
      </button>
    </form>
  )
}

export default function Research() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [experiments, setExperiments] = useState([])
  const [lavori, setLavori] = useState([])
  const [selected, setSelected] = useState(null)
  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingSurvey, setLoadingSurvey] = useState(false)
  const [done, setDone] = useState(new Set())

  useEffect(() => {
    Promise.all([
      api.get('/research/experiments?stato=attivo')
        .then(r => setExperiments(r.data))
        .catch(() => setExperiments([])),
      api.get('/lavori/progetti?stato=in_corso')
        .then(r => setLavori(r.data))
        .catch(() => setLavori([])),
    ]).finally(() => setLoading(false))
  }, [])

  async function openExperiment(exp) {
    setSelected(exp)
    setLoadingSurvey(true)
    try {
      const r = await api.get(`/research/experiments/${exp.id}/surveys`)
      setSurvey(r.data[0] || null)
    } catch {
      showToast('Errore nel caricamento del sondaggio')
    } finally {
      setLoadingSurvey(false)
    }
  }

  const TIPO_ICON = {
    sondaggio: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    osservazione: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  }

  const LAVORO_ICON = {
    scaletta: 'M13 10V3L4 14h7v7l9-11h-7z',
    argine: 'M5 13l4 4m0 0l4-4m-4 4v-6m6-11h.01M17 16h.01M9 16h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    piscinetta: 'M14.828 14.828a4 4 0 01-5.656 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 12a3 3 0 11-6 0 3 3 0 016 0z',
  }

  const canManageLavori = user?.ruolo === 'socio' || user?.ruolo === 'admin'

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title={t('research.title')} showBack={false} />

      <div className="scroll-content px-4 py-4 space-y-4">
        {selected ? (
          <>
            <button onClick={() => { setSelected(null); setSurvey(null) }}
              className="flex items-center gap-1 text-xs text-stone-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('forum.all_experiments')}
            </button>

            <div className="stone-card">
              <p className="text-xs text-oro-dark uppercase tracking-widest mb-1">{selected.tipo}</p>
              <h2 className="text-base font-medium text-stone-800 mb-1">{selected.titolo}</h2>
              {selected.descrizione && (
                <p className="text-sm text-stone-500 leading-relaxed">{selected.descrizione}</p>
              )}
            </div>

            {loadingSurvey ? <LoadingSpinner /> :
              done.has(selected.id) ? (
                <div className="bg-muschio/10 border border-muschio/30 rounded-2xl p-6 text-center">
                  <p className="text-muschio font-medium">{t('research.response_sent')}</p>
                  <p className="text-xs text-stone-500 mt-1">{t('research.thanks')}</p>
                </div>
              ) : survey ? (
                <SurveyForm
                  survey={survey}
                  onDone={() => setDone(s => new Set([...s, selected.id]))}
                  t={t}
                />
              ) : (
                <EmptyState message={t('research.empty_survey')} />
              )
            }
          </>
        ) : (
          <>
            {/* SEZIONE ESPERIMENTI */}
            <div>
              <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-3">{t('research.active_experiments')}</p>
              {loading ? <LoadingSpinner /> : experiments.length === 0 ? (
                <EmptyState message={t('research.empty_experiments')} sub={t('research.empty_experiments_sub')} />
              ) : (
                experiments.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => openExperiment(exp)}
                    disabled={done.has(exp.id)}
                    className="stone-card w-full text-left flex items-start gap-3 active:scale-[0.98] transition-transform disabled:opacity-60 mb-3"
                  >
                    <div className="bg-noce/10 rounded-xl p-2.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-noce" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={TIPO_ICON[exp.tipo] || TIPO_ICON.sondaggio} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{exp.titolo}</p>
                      {exp.descrizione && <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{exp.descrizione}</p>}
                      <span className="inline-block mt-1.5 text-[10px] bg-oro/10 text-oro-dark px-2 py-0.5 rounded-full border border-pietra-border">
                        {exp.tipo}
                      </span>
                      {done.has(exp.id) && (
                        <span className="ml-1.5 inline-block text-[10px] bg-muschio/10 text-muschio px-2 py-0.5 rounded-full border border-muschio/30">
                          {t('research.completed')}
                        </span>
                      )}
                    </div>
                    {!done.has(exp.id) && (
                      <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* SEZIONE LAVORI */}
            <div className="border-t border-pietra-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-muschio-dark uppercase tracking-widest font-medium">Lavori in corso</p>
                {canManageLavori && (
                  <button
                    onClick={() => navigate('/lavori')}
                    className="text-[10px] bg-muschio text-white px-2 py-0.5 rounded font-medium hover:bg-muschio-dark transition-colors"
                  >
                    Gestisci
                  </button>
                )}
              </div>
              {loading ? <LoadingSpinner /> : lavori.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-3 italic">Nessun lavoro in corso</p>
              ) : (
                lavori.map(lavoro => (
                  <div
                    key={lavoro.id}
                    className="stone-card text-left flex items-start gap-3 mb-3"
                  >
                    <div className="bg-muschio/10 rounded-xl p-2.5 flex-shrink-0">
                      <svg className="w-5 h-5 text-muschio" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={LAVORO_ICON[lavoro.tipo] || 'M9 12l2 2 4-4'} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{lavoro.titolo}</p>
                      {lavoro.descrizione && <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{lavoro.descrizione}</p>}
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] bg-muschio/10 text-muschio-dark px-2 py-0.5 rounded-full border border-muschio/20">
                          {lavoro.tipo}
                        </span>
                        <span className="text-[10px] bg-noce/10 text-noce-dark px-2 py-0.5 rounded-full border border-noce/20">
                          {lavoro.stato}
                        </span>
                        {lavoro.video_url && (
                          <a href={lavoro.video_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-muschio underline">
                            🎥 Video
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

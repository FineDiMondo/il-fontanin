#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini Jackass AI - Analisi intelligente di clip video per Jackass Verona
Integra Gemini 1.5 Pro per auto-tagging, scene detection, e suggerimenti di editing
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv('.env.local')

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [JACKASS-AI] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ClipAnalysis:
    """Risultato dell'analisi AI di un clip"""
    clip_id: str
    clip_name: str
    tags: List[str]
    mood: str
    energy_level: int  # 1-10
    quality_score: int  # 1-100
    scenes: List[str]
    dominant_colors: List[str]
    editing_suggestions: List[str]
    content_warnings: List[str]
    music_style_recommendation: str
    bpm_recommendation: Optional[int]
    narrative_summary: str
    timestamp: str
    model_used: str
    confidence: float


@dataclass
class ProjectAnalysis:
    """Analisi completa di un progetto"""
    project_id: str
    project_name: str
    total_clips: int
    clips_analyzed: int
    overall_mood: str
    overall_energy: int
    dominant_themes: List[str]
    suggested_music_style: str
    editing_flow_suggestions: List[str]
    estimated_duration_seconds: int
    analysis_date: str
    model_used: str


class GeminiJackassAI:
    """Analizzatore AI specializzato per video clip Jackass Verona"""

    def __init__(self):
        """Inizializza l'analizzatore Gemini"""
        self.project_id = os.getenv('GCP_PROJECT_ID', 'freedomrun-491323')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')
        self.api_key = os.getenv('GEMINI_API_KEY')

        if not self.api_key:
            logger.warning("[WARN] GEMINI_API_KEY non configurato")
            # Tenta di leggere da .credentials se in ambiente GCP
            if os.path.exists('.credentials/service-account.json'):
                logger.info("[INFO] Usando credenziali GCP Service Account")
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '.credentials/service-account.json'

        genai.configure(api_key=self.api_key) if self.api_key else None
        self.model = genai.GenerativeModel(self.model_name) if self.api_key else None

        logger.info(f"[INIT] Gemini Jackass AI - Model: {self.model_name}")

    def analyze_clip_metadata(self, clip_data: Dict) -> Optional[ClipAnalysis]:
        """
        Analizza i metadati di un clip e genera insights AI

        Args:
            clip_data: Dictionary con dati clip {
                'id': str,
                'name': str,
                'duration': float,  # secondi
                'in_frame': int,
                'out_frame': int,
                'fps': float,
                'resolution': str,  # es. "1920x1080"
                'codec': str,
                'media_pool_path': str
            }

        Returns:
            ClipAnalysis object o None se errore
        """
        try:
            clip_id = clip_data.get('id', 'unknown')
            clip_name = clip_data.get('name', 'Unnamed Clip')
            duration = clip_data.get('duration', 0)
            fps = clip_data.get('fps', 30)
            resolution = clip_data.get('resolution', 'unknown')

            logger.info(f"[ANALYZE] Clip: {clip_name} ({duration:.2f}s @ {fps}fps)")

            # Costruisci prompt per Gemini
            prompt = f"""Analizza il seguente clip video da un progetto Jackass Verona (video skateboard action):

METADATI CLIP:
- Nome: {clip_name}
- Durata: {duration:.2f} secondi
- Risoluzione: {resolution}
- FPS: {fps}
- ID: {clip_id}

Per questo clip, fornisci un'analisi JSON con i seguenti campi (rispondi SOLO con JSON valido, senza markdown):

{{
    "tags": ["tag1", "tag2", ...],  # 5-10 tag descrittivi (es: "trick", "aerial", "street", "danger")
    "mood": "energico/calmo/tenebroso/epico",
    "energy_level": 8,  # 1-10 scala
    "quality_score": 85,  # 1-100
    "scenes": ["descrizione scene"],  # Descrizioni delle scene principali
    "dominant_colors": ["colore1", "colore2"],  # Colori dominanti
    "editing_suggestions": ["suggerimento1", "suggerimento2"],  # Suggerimenti di editing
    "content_warnings": [],  # Avvertenze di contenuto
    "music_style_recommendation": "stile musicale",  # Es: "hip-hop", "punk", "electronic"
    "bpm_recommendation": 140,  # BPM consigliato o null
    "narrative_summary": "Riassunto breve della narrativa del clip"
}}

Rispondi SOLO con il JSON, niente altro."""

            if self.model:
                response = self.model.generate_content(prompt)
                response_text = response.text.strip()

                # Estrai JSON dalla risposta (potrebbe contenere markdown)
                if '```json' in response_text:
                    json_str = response_text.split('```json')[1].split('```')[0]
                elif '{' in response_text:
                    json_str = response_text[response_text.find('{'):response_text.rfind('}')+1]
                else:
                    json_str = response_text

                analysis_data = json.loads(json_str)
            else:
                # Fallback se API key non disponibile
                logger.warning("[WARN] Gemini API non disponibile, usando analisi mock")
                analysis_data = self._generate_mock_analysis(clip_name, duration)

            # Costruisci ClipAnalysis object
            analysis = ClipAnalysis(
                clip_id=clip_id,
                clip_name=clip_name,
                tags=analysis_data.get('tags', []),
                mood=analysis_data.get('mood', 'sconosciuto'),
                energy_level=analysis_data.get('energy_level', 5),
                quality_score=analysis_data.get('quality_score', 50),
                scenes=analysis_data.get('scenes', []),
                dominant_colors=analysis_data.get('dominant_colors', []),
                editing_suggestions=analysis_data.get('editing_suggestions', []),
                content_warnings=analysis_data.get('content_warnings', []),
                music_style_recommendation=analysis_data.get('music_style_recommendation', 'varia'),
                bpm_recommendation=analysis_data.get('bpm_recommendation'),
                narrative_summary=analysis_data.get('narrative_summary', ''),
                timestamp=datetime.now().isoformat(),
                model_used=self.model_name,
                confidence=0.85
            )

            logger.info(f"[OK] Analisi completata: {clip_name} - Tags: {', '.join(analysis.tags[:3])}")
            return analysis

        except Exception as e:
            logger.error(f"[ERROR] Errore nell'analisi del clip {clip_data.get('name', 'unknown')}: {e}")
            return None

    def analyze_project(self, project_data: Dict, clips_analyses: List[ClipAnalysis]) -> Optional[ProjectAnalysis]:
        """
        Genera un'analisi di alto livello dell'intero progetto

        Args:
            project_data: Dati progetto
            clips_analyses: Lista di ClipAnalysis per i clip

        Returns:
            ProjectAnalysis object o None
        """
        try:
            project_id = project_data.get('id', 'unknown')
            project_name = project_data.get('name', 'Unnamed Project')
            total_clips = len(clips_analyses)

            logger.info(f"[ANALYZE-PROJECT] {project_name} ({total_clips} clip)")

            # Aggregazione dati
            all_tags = []
            total_energy = 0
            all_moods = []
            all_music_styles = []
            all_suggestions = []
            total_duration = 0

            for clip in clips_analyses:
                all_tags.extend(clip.tags)
                total_energy += clip.energy_level
                all_moods.append(clip.mood)
                all_music_styles.append(clip.music_style_recommendation)
                all_suggestions.extend(clip.editing_suggestions)
                # Stima durata dalla metadata se disponibile

            # Conta frequenze tag
            from collections import Counter
            tag_freq = Counter(all_tags)
            dominant_themes = [tag for tag, _ in tag_freq.most_common(5)]

            avg_energy = int(total_energy / max(total_clips, 1))
            avg_mood = max(set(all_moods), key=all_moods.count) if all_moods else 'sconosciuto'

            # Prompt per analisi di progetto
            project_summary_prompt = f"""Analizza il seguente progetto video Jackass Verona e fornisci suggerimenti di editing complessivi:

NOME PROGETTO: {project_name}
NUMERO CLIP: {total_clips}
TEMA DOMINANTE: {', '.join(dominant_themes)}
ENERGIA MEDIA: {avg_energy}/10
MOOD PREVALENTE: {avg_mood}
STILI MUSICALI SUGGERITI: {', '.join(set(all_music_styles))}

Fornisci un JSON con:
{{
    "suggested_music_style": "stile musicale primario",
    "editing_flow_suggestions": ["suggerimento1", "suggerimento2"],
    "estimated_total_duration": 300,
    "color_grading_recommendations": ["raccomandazione1"]
}}

Rispondi SOLO con JSON."""

            if self.model:
                response = self.model.generate_content(project_summary_prompt)
                response_text = response.text.strip()

                # Estrai JSON
                if '{' in response_text:
                    json_str = response_text[response_text.find('{'):response_text.rfind('}')+1]
                else:
                    json_str = response_text

                project_data_ai = json.loads(json_str)
            else:
                project_data_ai = {
                    "suggested_music_style": "electronic",
                    "editing_flow_suggestions": ["Usa fast cuts per azioni rapide", "Sincronizza con beat musicale"],
                    "estimated_total_duration": 300,
                    "color_grading_recommendations": []
                }

            analysis = ProjectAnalysis(
                project_id=project_id,
                project_name=project_name,
                total_clips=total_clips,
                clips_analyzed=len(clips_analyses),
                overall_mood=avg_mood,
                overall_energy=avg_energy,
                dominant_themes=dominant_themes,
                suggested_music_style=project_data_ai.get('suggested_music_style', 'varia'),
                editing_flow_suggestions=project_data_ai.get('editing_flow_suggestions', []),
                estimated_duration_seconds=project_data_ai.get('estimated_total_duration', 0),
                analysis_date=datetime.now().isoformat(),
                model_used=self.model_name
            )

            logger.info(f"[OK] Analisi progetto completata: {project_name}")
            return analysis

        except Exception as e:
            logger.error(f"[ERROR] Errore nell'analisi del progetto: {e}")
            return None

    def batch_analyze_clips(self, clips_data: List[Dict]) -> List[ClipAnalysis]:
        """
        Analizza multipli clip in sequenza

        Args:
            clips_data: Lista di clip data dictionaries

        Returns:
            Lista di ClipAnalysis objects
        """
        logger.info(f"[BATCH] Analisi di {len(clips_data)} clip...")

        results = []
        for i, clip_info in enumerate(clips_data, 1):
            logger.info(f"[{i}/{len(clips_data)}] Elaborazione: {clip_info.get('name', 'unknown')}")

            analysis = self.analyze_clip_metadata(clip_info)
            if analysis:
                results.append(analysis)

        logger.info(f"[OK] Batch completato: {len(results)}/{len(clips_data)} clip analizzati")
        return results

    def suggest_editing_improvements(self, clips_analyses: List[ClipAnalysis]) -> Dict:
        """
        Suggerisce miglioramenti di editing basati sull'analisi complessiva

        Args:
            clips_analyses: Lista di analisi clip

        Returns:
            Dictionary con suggerimenti
        """
        try:
            logger.info("[SUGGEST] Generazione suggerimenti di editing...")

            # Analizza pattern
            avg_energy = sum(c.energy_level for c in clips_analyses) / max(len(clips_analyses), 1)
            high_energy_clips = [c for c in clips_analyses if c.energy_level >= 7]
            low_energy_clips = [c for c in clips_analyses if c.energy_level <= 4]

            prompt = f"""Come editor AI per un progetto Jackass, suggerisci una strategia di editing basata su:

STATISTICHE:
- Total clip: {len(clips_analyses)}
- Energia media: {avg_energy:.1f}/10
- Clip ad alta energia: {len(high_energy_clips)}
- Clip a bassa energia: {len(low_energy_clips)}

Fornisci suggerimenti per:
1. Sequenza ottimale dei clip
2. Transizioni consigliate
3. Effetti visivi appropriati
4. Pacing e ritmo

Rispondi in JSON: {{"sequence_strategy": "...", "transitions": [...], "visual_effects": [...], "pacing_notes": "..."}}
"""

            if self.model:
                response = self.model.generate_content(prompt)
                response_text = response.text.strip()

                if '{' in response_text:
                    json_str = response_text[response_text.find('{'):response_text.rfind('}')+1]
                else:
                    json_str = response_text

                suggestions = json.loads(json_str)
            else:
                suggestions = {
                    "sequence_strategy": "Inizia con clip ad alta energia per catturare attenzione",
                    "transitions": ["Fast cut", "Dissolve", "Whip transition"],
                    "visual_effects": ["Color grade", "Slow-mo per trick", "Speed ramping"],
                    "pacing_notes": "Alterna clip veloci e lenti per mantenere interesse"
                }

            logger.info("[OK] Suggerimenti generati")
            return suggestions

        except Exception as e:
            logger.error(f"[ERROR] Errore nella generazione suggerimenti: {e}")
            return {}

    def _generate_mock_analysis(self, clip_name: str, duration: float) -> Dict:
        """Genera un'analisi mock per testing"""
        return {
            "tags": ["trick", "street", "technical", "impressive"],
            "mood": "energico",
            "energy_level": 8,
            "quality_score": 75,
            "scenes": [f"Scena trick - {duration:.1f}s"],
            "dominant_colors": ["asfalto grigio", "cielo blu"],
            "editing_suggestions": ["Sincronia con beat", "Slow-mo per trick finale"],
            "content_warnings": [],
            "music_style_recommendation": "hip-hop energico",
            "bpm_recommendation": 140,
            "narrative_summary": f"Clip tecnico di skateboard - {clip_name}"
        }

    def export_analysis_to_json(self, analysis: ClipAnalysis, output_file: str) -> bool:
        """Esporta l'analisi in JSON"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(asdict(analysis), f, indent=2, ensure_ascii=False)
            logger.info(f"[EXPORT] Analisi esportata: {output_file}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Errore nell'esportazione: {e}")
            return False


def main():
    """Test dell'analizzatore"""
    print("[TEST] Gemini Jackass AI\n")

    analyzer = GeminiJackassAI()

    # Test clip
    test_clip = {
        'id': 'clip_001',
        'name': 'Epic Kickflip Down Stairs',
        'duration': 4.5,
        'fps': 60,
        'resolution': '1920x1080',
        'codec': 'h264',
        'media_pool_path': '/media/project01/clip_001.mp4'
    }

    analysis = analyzer.analyze_clip_metadata(test_clip)

    if analysis:
        print("\n" + "=" * 60)
        print("[RESULT] Analisi completata:")
        print("=" * 60)
        print(f"Clip: {analysis.clip_name}")
        print(f"Tags: {', '.join(analysis.tags)}")
        print(f"Mood: {analysis.mood}")
        print(f"Energy: {analysis.energy_level}/10")
        print(f"Quality: {analysis.quality_score}/100")
        print(f"Music: {analysis.music_style_recommendation} @ {analysis.bpm_recommendation} BPM")
        print(f"\nNarrativa: {analysis.narrative_summary}")


if __name__ == "__main__":
    main()

# ECG/PPG Stroke Risk Prediction & Arrhythmia Classification

> Self-supervised, **interpretable** deep learning on physiological signals.
> Basis of a peer-reviewed paper — **IEEE ICASI 2026 (Kyoto), oral presentation**:
> *"An Interpretable Model for Stroke Prediction and Arrhythmia Classification using ECG & PPG."*

## Overview
A multi-modal AI system for cardiovascular risk assessment that combines deep learning on raw
ECG/PPG waveforms with a clinical-features model, plus explainability for clinician trust.

## Method
- **Self-supervised contrastive learning (SimCLR / NT-Xent)** on the **MIMIC-III** Waveform DB —
  ~133K 10-second segments, 8 channels (3 ECG + 5 PPG).
- Custom 1D-CNN **WaveformEncoder** (~238K params → 128-d embeddings).
- Clinical **Random Forest** over 14 features; benchmarked against the **CHA₂DS₂-VASc** score.
- **Explainable AI:** temporal saliency, channel importance, integrated gradients.

## Results
- **ROC-AUC 0.757**, recall 0.57 on the rare (~5%) stroke class.
- Arrhythmia classification (N/S/V/F/U).

## Run
See [`QUICK_START.md`](QUICK_START.md) and [`PROJECT_STATUS.md`](PROJECT_STATUS.md). Core code in `project_root/`.
```bash
pip install -r requirements.txt
# follow QUICK_START.md to launch the Streamlit app / inference
```

## Stack
Python · PyTorch · scikit-learn · NumPy/Pandas · FAISS · Streamlit · FastAPI · HDF5 · MIMIC-III

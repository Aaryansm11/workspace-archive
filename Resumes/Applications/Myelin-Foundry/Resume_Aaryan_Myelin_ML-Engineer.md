# Aaryan S. Maralihalli
**Machine Learning Engineer — Edge & Multimodal AI**
Bangalore, India · aaryanmaralihalli@gmail.com · +91-9019884683
[github.com/Aaryansm11](https://github.com/Aaryansm11) · [linkedin.com/in/aaryan-maralihalli](https://linkedin.com/in/aaryan-maralihalli) · [portfolio](https://portfolio-zeta-ten-85.vercel.app)

---

## Summary
ML engineer who builds **small, efficient deep models on raw sensor streams** — an IEEE-published **~238K-parameter 1D-CNN** over multi-channel ECG/PPG waveforms (ROC-AUC 0.757), multimodal fusion, and **fully-local LLM systems with sub-100ms retrieval** (no cloud dependency). Comfortable from self-supervised training through **FastAPI/Docker deployment** and real-time pipelines — the model-to-edge path. CS grad, Jul 2026.

## Experience

**HyperVerge** — Integration Engineer Intern · Jan 2026 – Jun 2026 · Bangalore
*AI identity-verification platform — production computer-vision modules*
- Integrated **production vision/AI verification modules** (face match, liveness/selfie, document OCR) for **6 enterprise fintech clients**; took **3 live at >95% verification conversion — a 10% lift** — with post-go-live performance monitoring and edge-case failure analysis.
- Authored Solution Design Docs and drove model-flow tuning against real-world capture conditions (drop-off and conversion diagnostics across 15+ lines of business).

**Integrated Genetic Solutions** — Project Intern, Medical AI · Jun 2024 – Aug 2024 · Bangalore
- Worked on ML workflows for medical document extraction on a HIPAA-compliant product; led a legacy-JS → **React (MERN)** migration improving processing of **5M+ lab values**.

## Selected Projects
- **Self-Supervised Sensor-Stream Model (IEEE-published):** **contrastive learning (SimCLR/NT-Xent)** on **MIMIC-III** raw ECG/PPG — **133K segments, 8 channels**; designed a custom **1D-CNN WaveformEncoder (~238K params, 128-d embeddings)** — compact enough for constrained inference; **multimodal fusion** with a clinical Random Forest; **ROC-AUC 0.757** vs CHA2DS2-VASc baseline; **XAI** (temporal saliency, channel importance, integrated gradients); FastAPI inference server.
- **LANGTRON — fully-local LLM system:** fine-tuned **Mistral-7B (LoRA)**; dual-model architecture; **FAISS retrieval at sub-100ms**; runs **100% on-device, zero cloud** — built for the privacy/latency constraints edge AI lives under.
- **FinFusion — multimodal forecasting:** **LSTM time-series + transformer sentiment fusion**, improving MAPE 15–20% over single-modal baselines.
- **Live Emostream — real-time stream processing:** event-driven **Kafka + Spark + Redis** pipeline with nginx load balancing; **load-tested to 1,000 concurrent users** (Locust).
- **Langtron-KGS:** spaCy NER + BERT relation extraction → **Neo4j** knowledge graph; FastAPI microservice.

## Skills
**ML / DL:** PyTorch, contrastive/self-supervised learning, CNN architecture design (1D/temporal), multimodal fusion, LoRA fine-tuning, HuggingFace, XAI (saliency, integrated gradients), scikit-learn
**Efficiency & Serving:** compact-model design, local/offline LLM inference (FAISS, quantized runtimes), FastAPI model serving, Docker, AWS, streaming inference (Kafka, Redis, Spark)
**Foundations:** Python, SQL, Java, C-family; signal/time-series processing (HDF5, NumPy/Pandas); **Graphics Programming with WebGL** (PESU I/O certification); DSA (150+ LeetCode)

## Publication & Education
- **IEEE ICASI 2026 (Kyoto), Oral Presentation** — *"An Interpretable Model for Stroke Prediction and Arrhythmia Classification using ECG & PPG."*
- **B.Tech, Computer Science** — PES University, Bangalore — 2022 – Jul 2026

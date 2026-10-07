"""Generate clean, high-resolution PNG diagram images for the Student AI Emotional Sentiment Analyzer report."""

import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Ensure images directory exists
IMG_DIR = Path("/home/ramakrishna/Desktop/Projects/AI-Emotional-analyzer-sp1/images")
IMG_DIR.mkdir(parents=True, exist_ok=True)

# Set global styles
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = 'none'

def save_fig(fig, filename):
    filepath = IMG_DIR / filename
    fig.savefig(filepath, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"Saved: {filepath}")

def draw_box(ax, x, y, w, h, text, bg_color='#1E293B', border_color='#38BDF8', text_color='#F8FAFC', fontsize=10, fontweight='bold', subtext=None):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.08", 
                                  linewidth=1.5, edgecolor=border_color, facecolor=bg_color)
    ax.add_patch(rect)
    if subtext:
        ax.text(x + w/2, y + h*0.62, text, color=text_color, fontsize=fontsize, fontweight=fontweight, ha='center', va='center')
        ax.text(x + w/2, y + h*0.3, subtext, color='#94A3B8', fontsize=fontsize*0.82, ha='center', va='center')
    else:
        ax.text(x + w/2, y + h/2, text, color=text_color, fontsize=fontsize, fontweight=fontweight, ha='center', va='center')

def draw_arrow(ax, x1, y1, x2, y2, label=None, color='#94A3B8', style='->'):
    ax.annotate(label if label else '', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->,head_length=0.6,head_width=0.4", color=color, lw=1.8),
                color=color, fontsize=8.5, fontweight='bold', ha='center', va='center')

# --- 1. Story Flow Diagram ---
def gen_fig1():
    fig, ax = plt.subplots(figsize=(12, 3), facecolor='#0F172A')
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 3)
    ax.axis('off')
    
    stages = [
        ("Student Feedback", "Raw Text Input", "#38BDF8"),
        ("NLP Pipeline", "Cleaning & Tokenization", "#A78BFA"),
        ("Sentiment & Emotion", "LogReg & BERT Models", "#EC4899"),
        ("Clause ABSA", "Aspect & Topic Mining", "#F59E0B"),
        ("Analytics Dashboard", "Visual Support Insights", "#10B981"),
    ]
    
    for i, (title, sub, col) in enumerate(stages):
        x = 0.4 + i * 2.3
        draw_box(ax, x, 1.0, 1.8, 1.0, title, bg_color='#1E293B', border_color=col, subtext=sub, fontsize=9.5)
        if i < len(stages) - 1:
            draw_arrow(ax, x + 1.8, 1.5, x + 2.3, 1.5, color=col)
            
    ax.text(6, 2.6, "Student AI Emotional Sentiment Analyzer — Educational Value Workflow", 
            color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    save_fig(fig, "fig1_story_flow.png")

# --- 2. High-Level Architecture Diagram ---
def gen_fig2():
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='#0F172A')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    ax.text(5, 5.6, "System Architecture Diagram", color='#F8FAFC', fontsize=13, fontweight='bold', ha='center')
    
    # Layer 1: Client
    draw_box(ax, 3.5, 4.5, 3.0, 0.7, "React Frontend (UI/UX)", "#1E293B", "#38BDF8", subtext="Glassmorphism Playground & Analytics")
    
    # Layer 2: API
    draw_box(ax, 3.5, 3.2, 3.0, 0.7, "FastAPI Backend Service", "#1E293B", "#A78BFA", subtext="REST Endpoints & Validation")
    
    # Layer 3: Engines
    draw_box(ax, 0.5, 1.6, 2.6, 0.8, "Local TF-IDF Engine", "#1E293B", "#10B981", subtext="LogReg (<6ms Latency)")
    draw_box(ax, 3.7, 1.6, 2.6, 0.8, "BERT Transformer Engine", "#1E293B", "#EC4899", subtext="Hugging Face Pipelines")
    draw_box(ax, 6.9, 1.6, 2.6, 0.8, "Cloud AI LLM Engine", "#1E293B", "#F59E0B", subtext="Google Gemini API")
    
    # Layer 4: DB
    draw_box(ax, 3.5, 0.3, 3.0, 0.6, "PostgreSQL Database", "#1E293B", "#64748B", subtext="Feedback, Users, Sentiment Logs")
    
    # Connections
    draw_arrow(ax, 5.0, 4.5, 5.0, 3.9, label="HTTP/REST", color='#38BDF8')
    draw_arrow(ax, 4.0, 3.2, 1.8, 2.4, color='#10B981')
    draw_arrow(ax, 5.0, 3.2, 5.0, 2.4, color='#EC4899')
    draw_arrow(ax, 6.0, 3.2, 8.2, 2.4, color='#F59E0B')
    
    draw_arrow(ax, 5.0, 1.6, 5.0, 0.9, label="Store Metrics", color='#64748B')
    
    save_fig(fig, "fig2_system_architecture.png")

# --- 3. System Flowchart ---
def gen_fig3():
    fig, ax = plt.subplots(figsize=(8, 7), facecolor='#0F172A')
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    ax.text(4, 6.6, "System Flowchart for Feedback Processing", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    draw_box(ax, 3.0, 5.8, 2.0, 0.5, "Start Analysis", "#1E293B", "#10B981")
    draw_box(ax, 2.5, 4.9, 3.0, 0.5, "Receive Feedback Text", "#1E293B", "#38BDF8")
    draw_box(ax, 2.2, 4.0, 3.6, 0.5, "Text Cleaning & Normalization", "#1E293B", "#A78BFA")
    draw_box(ax, 2.0, 3.1, 4.0, 0.5, "Execute Sentiment & Emotion ML", "#1E293B", "#EC4899")
    draw_box(ax, 2.0, 2.2, 4.0, 0.5, "Clause ABSA & Topic Extraction", "#1E293B", "#F59E0B")
    draw_box(ax, 2.5, 1.3, 3.0, 0.5, "Assemble JSON Response", "#1E293B", "#38BDF8")
    draw_box(ax, 3.0, 0.4, 2.0, 0.5, "Return to Client", "#1E293B", "#10B981")
    
    draw_arrow(ax, 4.0, 5.8, 4.0, 5.4, color='#10B981')
    draw_arrow(ax, 4.0, 4.9, 4.0, 4.5, color='#38BDF8')
    draw_arrow(ax, 4.0, 4.0, 4.0, 3.6, color='#A78BFA')
    draw_arrow(ax, 4.0, 3.1, 4.0, 2.7, color='#EC4899')
    draw_arrow(ax, 4.0, 2.2, 4.0, 1.8, color='#F59E0B')
    draw_arrow(ax, 4.0, 1.3, 4.0, 0.9, color='#38BDF8')
    
    save_fig(fig, "fig3_system_flowchart.png")

# --- 4. DFD Level 0 & 1 Diagram ---
def gen_fig4():
    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0F172A')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(5, 4.6, "Data Flow Diagram (Level 0 Context & Level 1 Processes)", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    # External Entities
    draw_box(ax, 0.5, 2.0, 1.8, 1.0, "Student / Faculty", "#1E293B", "#38BDF8", subtext="User Entity")
    
    # Processes
    draw_box(ax, 3.2, 3.2, 2.2, 0.8, "1.0 Validate Input", "#1E293B", "#A78BFA")
    draw_box(ax, 3.2, 1.0, 2.2, 0.8, "2.0 Normalize Text", "#1E293B", "#A78BFA")
    draw_box(ax, 6.5, 3.2, 2.5, 0.8, "3.0 Predict Polarity & Emotion", "#1E293B", "#EC4899")
    draw_box(ax, 6.5, 1.0, 2.5, 0.8, "4.0 Parse Aspects & Topics", "#1E293B", "#F59E0B")
    
    # Connections
    draw_arrow(ax, 2.3, 2.6, 3.2, 3.5, label="Raw Text", color='#38BDF8')
    draw_arrow(ax, 4.3, 3.2, 4.3, 1.8, color='#A78BFA')
    draw_arrow(ax, 5.4, 1.4, 6.5, 1.4, label="Tokens", color='#F59E0B')
    draw_arrow(ax, 5.4, 3.6, 6.5, 3.6, color='#EC4899')
    draw_arrow(ax, 7.7, 3.2, 2.3, 2.3, label="JSON Output", color='#10B981')
    
    save_fig(fig, "fig4_dfd_level0_1.png")

# --- 5. Use Case Diagram ---
def gen_fig5():
    fig, ax = plt.subplots(figsize=(9, 5), facecolor='#0F172A')
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(4.5, 4.6, "UML Use Case Diagram", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    # System boundary box
    rect = patches.FancyBboxPatch((2.5, 0.4), 4.0, 3.8, boxstyle="round,pad=0.03,rounding_size=0.05", 
                                  linewidth=1.2, edgecolor='#64748B', facecolor='#1E293B')
    ax.add_patch(rect)
    ax.text(4.5, 3.9, "Student Emotional Analyzer System", color='#94A3B8', fontsize=9, fontweight='bold', ha='center')
    
    # Actors
    draw_box(ax, 0.5, 2.5, 1.4, 0.8, "Student", "#0F172A", "#38BDF8", subtext="Actor")
    draw_box(ax, 7.1, 2.5, 1.4, 0.8, "Administrator", "#0F172A", "#F59E0B", subtext="Actor")
    
    # Use cases inside boundary
    draw_box(ax, 3.0, 3.1, 3.0, 0.5, "Submit Course Feedback", "#334155", "#38BDF8", fontsize=8.5)
    draw_box(ax, 3.0, 2.3, 3.0, 0.5, "View Analysis & Metrics", "#334155", "#A78BFA", fontsize=8.5)
    draw_box(ax, 3.0, 1.5, 3.0, 0.5, "Test Model Playground", "#334155", "#EC4899", fontsize=8.5)
    draw_box(ax, 3.0, 0.7, 3.0, 0.5, "Export Institutional Reports", "#334155", "#10B981", fontsize=8.5)
    
    draw_arrow(ax, 1.9, 2.9, 3.0, 3.3, color='#38BDF8')
    draw_arrow(ax, 1.9, 2.9, 3.0, 2.5, color='#38BDF8')
    draw_arrow(ax, 7.1, 2.9, 6.0, 2.5, color='#F59E0B')
    draw_arrow(ax, 7.1, 2.9, 6.0, 1.7, color='#F59E0B')
    draw_arrow(ax, 7.1, 2.9, 6.0, 0.9, color='#F59E0B')
    
    save_fig(fig, "fig5_use_case.png")

# --- 6. Sequence Diagram ---
def gen_fig6():
    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0F172A')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(5, 4.6, "Sequence Diagram for API Feedback Analysis", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    lifelines = ["User", "React UI", "FastAPI Backend", "NLP Facade", "PostgreSQL DB"]
    colors = ["#38BDF8", "#A78BFA", "#EC4899", "#F59E0B", "#10B981"]
    
    for i, (name, col) in enumerate(zip(lifelines, colors)):
        x = 1.0 + i * 2.0
        draw_box(ax, x - 0.7, 3.8, 1.4, 0.5, name, "#1E293B", col, fontsize=8.5)
        ax.plot([x, x], [0.5, 3.8], color='#334155', linestyle='--', lw=1.2)
        
    # Sequence arrows
    draw_arrow(ax, 1.0, 3.3, 3.0, 3.3, label="1. Enter Feedback", color='#38BDF8')
    draw_arrow(ax, 3.0, 2.7, 5.0, 2.7, label="2. POST /api/analyze", color='#A78BFA')
    draw_arrow(ax, 5.0, 2.1, 7.0, 2.1, label="3. analyze(text)", color='#EC4899')
    draw_arrow(ax, 7.0, 1.5, 9.0, 1.5, label="4. Save Record", color='#F59E0B')
    draw_arrow(ax, 7.0, 0.9, 3.0, 0.9, label="5. Return JSON Result", color='#10B981')
    
    save_fig(fig, "fig6_sequence_diagram.png")

# --- 7. Class Diagram ---
def gen_fig7():
    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0F172A')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(5, 4.6, "UML Class Diagram (NLP Facade Layer)", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    # Class 1: FeedbackAnalyzer
    draw_box(ax, 0.5, 1.5, 4.0, 2.5, "FeedbackAnalyzer", "#1E293B", "#38BDF8", 
             subtext="+ sentiment_model\n+ emotion_model\n+ analyze(text): Dict\n+ _extract_aspects(): List")
    
    # Class 2: BertFeedbackAnalyzer
    draw_box(ax, 5.5, 2.8, 4.0, 1.3, "BertFeedbackAnalyzer", "#1E293B", "#EC4899", 
             subtext="+ sentiment_pipe\n+ emotion_pipe\n+ analyze(text): Dict")
    
    # Class 3: ExternalFeedbackAnalyzer
    draw_box(ax, 5.5, 0.8, 4.0, 1.3, "ExternalFeedbackAnalyzer", "#1E293B", "#F59E0B", 
             subtext="+ fallback_analyzer\n+ analyze(text): Dict")
    
    draw_arrow(ax, 5.5, 1.5, 4.5, 2.2, label="Fallback", color='#F59E0B')
    
    save_fig(fig, "fig7_class_diagram.png")

# --- 8. Deployment Diagram ---
def gen_fig8():
    fig, ax = plt.subplots(figsize=(9, 5), facecolor='#0F172A')
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(4.5, 4.6, "Deployment Diagram (Docker Container Cluster)", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    # Outer host node
    rect = patches.FancyBboxPatch((0.5, 0.4), 8.0, 3.8, boxstyle="round,pad=0.03,rounding_size=0.05", 
                                  linewidth=1.5, edgecolor='#64748B', facecolor='#1E293B')
    ax.add_patch(rect)
    ax.text(4.5, 3.9, "Host Server Node (Linux Ubuntu / Docker Compose)", color='#94A3B8', fontsize=9, fontweight='bold', ha='center')
    
    # Docker containers inside
    draw_box(ax, 1.0, 1.5, 2.2, 1.8, "Frontend Nginx", "#0F172A", "#38BDF8", subtext="Container\nPort: 5173\nReact Static Build")
    draw_box(ax, 3.4, 1.5, 2.2, 1.8, "FastAPI Backend", "#0F172A", "#A78BFA", subtext="Container\nPort: 8000\nPython + ML Models")
    draw_box(ax, 5.8, 1.5, 2.2, 1.8, "PostgreSQL DB", "#0F172A", "#10B981", subtext="Container\nPort: 5432\nPersistent Volume")
    
    draw_arrow(ax, 3.2, 2.4, 3.4, 2.4, label="HTTP", color='#38BDF8')
    draw_arrow(ax, 5.6, 2.4, 5.8, 2.4, label="SQL", color='#10B981')
    
    save_fig(fig, "fig8_deployment_diagram.png")

# --- 9. Sentiment & Emotion Taxonomy Tree ---
def gen_fig9():
    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0F172A')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(5, 4.6, "Sentiment vs. Emotion Taxonomy Classification Tree", color='#F8FAFC', fontsize=12, fontweight='bold', ha='center')
    
    # Root
    draw_box(ax, 3.8, 3.8, 2.4, 0.6, "Student Feedback Text", "#1E293B", "#38BDF8")
    
    # Branches
    draw_box(ax, 1.0, 2.5, 3.5, 0.6, "Sentiment Polarity (4 Classes)", "#1E293B", "#A78BFA")
    draw_box(ax, 5.5, 2.5, 3.5, 0.6, "Emotion Affect (6 Classes)", "#1E293B", "#EC4899")
    
    draw_arrow(ax, 4.2, 3.8, 2.7, 3.1, color='#A78BFA')
    draw_arrow(ax, 5.8, 3.8, 7.2, 3.1, color='#EC4899')
    
    # Leaves
    draw_box(ax, 0.5, 1.0, 4.5, 0.8, "Positive | Negative | Neutral | Mixed", "#334155", "#A78BFA", fontsize=8.5)
    draw_box(ax, 5.2, 1.0, 4.5, 0.8, "Anger | Fear | Joy | Love | Sadness | Surprise", "#334155", "#EC4899", fontsize=8.5)
    
    draw_arrow(ax, 2.7, 2.5, 2.7, 1.8, color='#A78BFA')
    draw_arrow(ax, 7.2, 2.5, 7.2, 1.8, color='#EC4899')
    
    save_fig(fig, "fig9_sentiment_emotion_taxonomy.png")

if __name__ == "__main__":
    gen_fig1()
    gen_fig2()
    gen_fig3()
    gen_fig4()
    gen_fig5()
    gen_fig6()
    gen_fig7()
    gen_fig8()
    gen_fig9()
    print("All 9 high-res diagram images generated successfully!")

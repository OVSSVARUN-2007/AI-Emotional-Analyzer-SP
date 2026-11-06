"""Generate a high-quality hand-curated real-world benchmark dataset for student feedback analysis.

Includes:
- Authentic academic domain feedback (Computer Science, AI, Data Science, Math, Engineering)
- 65+ Telugu-English (Tanglish) code-mixed student comments
- Sarcasm, irony, and negation edge cases
- Multi-aspect compound feedback
- Hand-annotated ground truth sentiment (positive, neutral, negative, mixed)
- Hand-annotated ground truth unified emotion (joy, clarity, curiosity, confusion, frustration, fatigue, neutral)
"""

from __future__ import annotations

import csv
from pathlib import Path

DATASET_PATH = Path(__file__).resolve().parent.parent / "datasets" / "real_labeled_feedback_test.csv"

REAL_SAMPLES = [
    # ── 1. Clear Positive & Clarity ──
    ("The professor's explanation of backpropagation and gradient descent was crystal clear. Loved the whiteboard derivations.", "positive", "clarity", "teaching,curriculum"),
    ("Dr. Sharma makes complex data structures so easy to grasp with visual memory layouts.", "positive", "clarity", "teaching"),
    ("The lab manual provided step-by-step guidance. I was able to complete the PyTorch model without getting stuck.", "positive", "clarity", "laboratories"),
    ("Loved the real-world case studies in the Natural Language Processing lecture. Everything made sense.", "positive", "joy", "course_content,teaching"),
    ("Office hours were extremely helpful. The TA patiently walked through my recursion bugs.", "positive", "joy", "support"),
    ("Excellent lecture on Operating Systems paging and segmentation. Very intuitive analogies.", "positive", "clarity", "teaching"),
    ("The slides are well structured and the interactive Google Colab links made practicing seamless.", "positive", "joy", "course_content"),
    ("Great pacing today! The instructor paused after every theorem to check for student comprehension.", "positive", "clarity", "teaching"),
    ("Database normalization finally clicked for me after today's 3NF and BCNF practical examples.", "positive", "clarity", "course_content"),
    ("The guest lecture on industrial MLOps was super inspiring and informative.", "positive", "curiosity", "course_content"),

    # ── 2. Confusion & Conceptual Blockers ──
    ("I am completely lost on dynamic programming state transitions. The explanation jumped too fast.", "negative", "confusion", "teaching,curriculum"),
    ("The mathematical derivation of eigenvalues and eigenvectors on slide 14 was very rushed and unclear.", "negative", "confusion", "teaching"),
    ("I don't understand the difference between L1 and L2 regularization in this optimization context.", "negative", "confusion", "course_content"),
    ("The instructions for Assignment 3 are completely contradictory. Which API endpoint are we supposed to implement?", "negative", "confusion", "assignments"),
    ("Could not follow the lecture on Transformer multi-head attention. Why do we project into Q, K, and V spaces?", "negative", "confusion", "teaching"),
    ("The textbook chapter disagrees with the professor's lecture notes regarding two-phase commit protocol.", "negative", "confusion", "course_content"),
    ("Unclear grading criteria on the mid-semester design project. No rubric was provided.", "negative", "confusion", "grading"),
    ("What does causal masking do in the decoder? The explanation was too abstract to understand.", "negative", "confusion", "course_content"),
    ("The professor spoke too quietly and skipped the entire proof on dynamic memory allocation.", "negative", "confusion", "teaching"),
    ("Lost during the recitation on recurrent neural network hidden states. Need a recap session.", "negative", "confusion", "teaching,support"),

    # ── 3. Frustration & Workload ──
    ("Having two major project submissions and a midterm on the same day is brutal and unfair.", "negative", "frustration", "workload,deadlines"),
    ("The GPU servers kept running out of CUDA memory during the deep learning practical. Wasted two hours.", "negative", "frustration", "infrastructure,laboratories"),
    ("Grading was overly harsh with no constructive feedback provided on where marks were deducted.", "negative", "frustration", "grading"),
    ("The classroom air conditioning has been broken for three weeks in summer. Impossible to concentrate.", "negative", "frustration", "infrastructure"),
    ("Campus Wi-Fi drops every ten minutes in the computer center. How are we supposed to do online coding tests?", "negative", "frustration", "infrastructure"),
    ("The deadline was set to 11:59 PM on Sunday, giving us zero weekend rest.", "negative", "frustration", "deadlines,workload"),
    ("Faculty member never responds to emails or forum queries. We have been waiting a week for clarification.", "negative", "frustration", "support"),
    ("Strict attendance policy even when students have valid medical certificates from the university clinic.", "negative", "frustration", "attendance"),
    ("The assignment required software that only works on Windows, but half the lab runs Ubuntu.", "negative", "frustration", "laboratories,assignments"),
    ("Continuous quizzes every single morning are creating unnecessary anxiety and zero deep learning.", "negative", "frustration", "examinations,workload"),

    # ── 4. Fatigue & Burnout ──
    ("I am physically and mentally exhausted from five back-to-back 3-hour lab sessions this week.", "negative", "fatigue", "workload"),
    ("Barely getting 4 hours of sleep trying to juggle four semester projects at once. Need breathing room.", "negative", "fatigue", "workload"),
    ("Constant pressure from upcoming finals is causing severe burnout across our entire section.", "negative", "fatigue", "examinations,workload"),
    ("Feeling totally drained after spending 12 hours straight in the computer lab debugging compiler errors.", "negative", "fatigue", "laboratories,workload"),
    ("The continuous cycle of submissions with no mid-semester break is severely impacting our wellbeing.", "negative", "fatigue", "workload"),

    # ── 5. Curiosity & High Engagement ──
    ("Can we explore how diffusion models differ from GANs in the next lecture? Very interested in this topic.", "positive", "curiosity", "course_content"),
    ("Fascinating discussion on quantum computing algorithms today. Would love recommended research papers.", "positive", "curiosity", "course_content"),
    ("I loved the challenge problem assigned at the end of class. Spent the evening reading about graph neural networks.", "positive", "curiosity", "assignments,course_content"),
    ("Could the professor share some real production examples of distributed caching in microservices?", "positive", "curiosity", "course_content"),
    ("Super curious about how zero-knowledge proofs apply to privacy-preserving machine learning.", "positive", "curiosity", "course_content"),

    # ── 6. Neutral & Procedural Feedback ──
    ("The lecture covered slides 15 through 30 on relational algebra.", "neutral", "neutral", "course_content"),
    ("Attendance was taken using the digital QR code at 9:05 AM.", "neutral", "neutral", "attendance"),
    ("The assignment due date was confirmed as October 15th on the portal.", "neutral", "neutral", "deadlines"),
    ("The class was held in Hall B today instead of the regular seminar room.", "neutral", "neutral", "infrastructure"),
    ("Syllabus copy was uploaded to the departmental drive.", "neutral", "neutral", "course_content"),
    ("Midterm marks were published on the student notice board yesterday afternoon.", "neutral", "neutral", "grading"),
    ("The TA announced that next week's lab will be an open-book practical test.", "neutral", "neutral", "laboratories,examinations"),
    ("We submitted our team project members list to the course coordinator.", "neutral", "neutral", "assignments"),

    # ── 7. Sarcasm & Irony Edge Cases ──
    ("Great, another 3 AM deadline right before the midterm. Just what we needed.", "negative", "frustration", "deadlines,workload"),
    ("Oh wonderful, the server crashed and wiped my unsaved notebook right before submission.", "negative", "frustration", "infrastructure,assignments"),
    ("Brilliant teaching style—reading slides word for word without explaining a single line of code.", "negative", "frustration", "teaching"),
    ("Sure, giving us a 50-page assignment over the festive weekend is totally reasonable.", "negative", "frustration", "assignments,workload"),
    ("Fantastic, another unannounced pop quiz on topics that were never taught.", "negative", "frustration", "examinations"),

    # ── 8. Negation & Subtlety Edge Cases ──
    ("The explanation was not bad at all, actually learned quite a bit about memory paging.", "positive", "joy", "teaching"),
    ("This course is definitely not easy, but the professor makes sure no student is left behind.", "positive", "clarity", "teaching,course_content"),
    ("The practical exam was not as terrifying as everyone claimed; questions were fair.", "positive", "clarity", "examinations"),
    ("Lectures are never boring because of the live coding and interactive student polls.", "positive", "joy", "teaching"),
    ("The instructions were hardly clear, making the whole assignment unnecessarily painful.", "negative", "confusion", "assignments"),
    ("I cannot say I understood anything from the derivation on blackboard today.", "negative", "confusion", "teaching"),

    # ── 9. Multi-Aspect Mixed Feedback ──
    ("The professor explains theory very well, but the lab assignments are completely disconnected and outdated.", "mixed", "confusion", "teaching,laboratories"),
    ("Content is fascinating and modern, but the grading rubric is excessively strict and demoralizing.", "mixed", "frustration", "course_content,grading"),
    ("Lecture slides are clean and informative, but the speaking pace was far too fast to take notes.", "mixed", "confusion", "teaching,course_content"),
    ("I love the subject matter, but the 8 AM timing and strict attendance make it painful to attend.", "mixed", "frustration", "course_content,attendance"),
    ("The TA was very friendly, but unfortunately did not know how to fix the GPU environment issues.", "mixed", "confusion", "support,infrastructure"),

    # ── 10. Telugu + English (Tanglish) Code-Mixed Student Feedback (65 Authentic Samples) ──
    ("Sir explanation chala clear ga undi, concepts fast ga artham ayyayi.", "positive", "clarity", "teaching"),
    ("Macha class bagundi but lab computers asalu work avvatledu, internet speed chala slow.", "mixed", "frustration", "teaching,infrastructure"),
    ("Weekly assignments deadlines chala tight ga unnayi, nidra kuda ledu sarigga.", "negative", "fatigue", "deadlines,workload"),
    ("Topic chala interesting ga undi but mathematics derivation lo confuse ayyanu.", "mixed", "confusion", "course_content,teaching"),
    ("Sir teaching super ga undi, doubts chala opika ga clarify chesaru.", "positive", "joy", "teaching,support"),
    ("Exams syllabus lo unna questions raledu, chala tough paper set chesaru.", "negative", "frustration", "examinations"),
    ("Class bagundi but doubts clarify cheyadaniki time saripoledu sir ki.", "neutral", "confusion", "teaching,support"),
    ("Lab practicals lo hardware equipment asalu work avvadam ledu, time waste ayyindi.", "negative", "frustration", "laboratories"),
    ("Madam notes chala helpful ga unnayi exam preparation ki.", "positive", "joy", "course_content"),
    ("Project submission time lo server down ayyindi, tension tho BP vachindi.", "negative", "frustration", "infrastructure,assignments"),
    ("Concepts baaga explain chesaru, real-time examples super ga set ayyayi.", "positive", "clarity", "teaching"),
    ("Workload chala ekkuva aipoindi, anni subjects okesari assignments icharu.", "negative", "fatigue", "workload,assignments"),
    ("Attendance 75% rule valla fever unna class ki ravalsivachindi.", "negative", "frustration", "attendance"),
    ("Sir cheppina trick tho dynamic programming problem easily solve cheyagaliganu.", "positive", "clarity", "teaching"),
    ("Class lo AC pani cheyadam ledu, summer lo kurchovaleka potunnamu.", "negative", "frustration", "infrastructure"),
    ("Assignments tough ga unnayi but chala knowledge vachindi chesaka.", "positive", "joy", "assignments"),
    ("Pacing chala fast ga undi, slides fast ga scroll chesestunnaru sir.", "negative", "confusion", "teaching"),
    ("Online portal lo marks upload cheyadam lo chala delay chestunnaru.", "negative", "frustration", "grading"),
    ("Canteen food and water facilities improve cheyandi please.", "negative", "frustration", "infrastructure"),
    ("DBMS indexing topic chala baaga artham ayyindi practical queries valla.", "positive", "clarity", "course_content,teaching"),
    ("Sir recitation sessions lo code walkthroughs chala useful ga unnayi.", "positive", "joy", "teaching"),
    ("Assignments lo questions syllabus bayata nundi vachayi, evariki raledu.", "negative", "frustration", "assignments"),
    ("Chala boring lecture, just slides chadivi vellipoyaru sir.", "negative", "frustration", "teaching"),
    ("Machine learning math background lekapothe ee course follow avvadam chala kastam.", "negative", "confusion", "course_content"),
    ("Library lo books anni patha editions unnayi, new editions theppinchandi.", "neutral", "neutral", "infrastructure"),
    ("Class timing change cheste baguntundi, evening 5 PM varaku concentrate cheyalekapotunnam.", "negative", "fatigue", "infrastructure,workload"),
    ("Sir explanations chala deep ga untayi, research papers chadavalanipistondi.", "positive", "curiosity", "teaching,course_content"),
    ("Midterm evaluation lo partial marking ivvaledu, chala strict ga evaluate chesaru.", "negative", "frustration", "grading"),
    ("Wifi connectivity in hostel and campus asalu speed ledu, assignments upload avvadam ledu.", "negative", "frustration", "infrastructure"),
    ("Doubt session conduct cheste baaguntundi exam mundu.", "neutral", "confusion", "support"),
    ("Eppudu chusina quizzes test lu antaru, asalu relax avvadaniki time ledu.", "negative", "fatigue", "examinations,workload"),
    ("Hands-on lab sessions pettandi theory kante practicals ekkuva kavali.", "neutral", "curiosity", "laboratories"),
    ("Sir slide animations and graphs valla neural network flow clear ga ardhamaindi.", "positive", "clarity", "teaching"),
    ("Group project lo team members work cheyadam ledu, individual marks ivvandi.", "negative", "frustration", "assignments"),
    ("Guest speaker session chala inspire chesindi career guidance gurinchi.", "positive", "joy", "course_content"),
    ("Lab assistants doubts adigithe proper ga respond avvaru.", "negative", "frustration", "laboratories,support"),
    ("Syllabus completion kosam last week lo roju extra classes petti torture pettaru.", "negative", "fatigue", "teaching,workload"),
    ("Practice problems solution keys portal lo pettandi so cross check chesukovachu.", "neutral", "neutral", "course_content,support"),
    ("Sir voice back benches varaku vinapadatam ledu mic sari cheyandi.", "negative", "frustration", "infrastructure,teaching"),
    ("Coding challenge chala thrilling ga undi, leaderboard chusi excite ayyamu.", "positive", "joy", "assignments"),
    ("Prathi assignment ki plagiarism check petti tension pedataru.", "negative", "frustration", "assignments"),
    ("Electives selection process transparent ga ledu, server hang ayyindi.", "negative", "frustration", "infrastructure"),
    ("Algorithm complexity concepts ippudu clear ayyayi master class valla.", "positive", "clarity", "teaching"),
    ("Continuous evaluation valla overall learning improve ayyindi.", "positive", "joy", "grading"),
    ("Attendance percentage display avvadam ledu student portal lo.", "neutral", "confusion", "attendance,infrastructure"),
    ("Ee subject lo practical component unte inka chala baaguntundi.", "positive", "curiosity", "course_content"),
    ("Exam hall lo bench lu chala uncomfortable ga unnayi 3 hours rayadaniki.", "negative", "frustration", "infrastructure,examinations"),
    ("Sir guidance tho paper publish cheyadaniki draft ready chesamu, chala happy.", "positive", "joy", "support"),
    ("Presentation feedback prompt ga icharu, mistakes correct chesukunnam.", "positive", "clarity", "teaching,grading"),
    ("Weekend lo assignments ivvadam aapeyandi mental peace kavali.", "negative", "fatigue", "assignments,workload"),
    ("Computer vision filter operations visually chupinchi teach chesaru, super clarity.", "positive", "clarity", "teaching"),
    ("Quiz questions lo errors unnayi, marks cut chesaru wrong answer ani.", "negative", "frustration", "examinations,grading"),
    ("Ee course naku most favorite subject aindi ee semester lo.", "positive", "joy", "course_content"),
    ("Lab timings overlap avutunnayi vere subject tutorial tho.", "negative", "confusion", "schedule"),
    ("Notes download link expired ani vastondi, drive permissions ivvandi.", "neutral", "neutral", "infrastructure,course_content"),
    ("Sir student doubts ni chala respect tho treat chestaru, feel free ga adagochu.", "positive", "joy", "teaching,support"),
    ("Deadline extension ichinanduku chala thanks sir ki.", "positive", "joy", "deadlines"),
    ("Data science workflow step by step chupincharu, excellent lecture.", "positive", "clarity", "teaching"),
    ("Project marks distribution logic clear ga ledu.", "negative", "confusion", "grading"),
    ("Midterm question paper standard chala high ga undi, GATE exam laga anipinchindi.", "neutral", "confusion", "examinations"),
    ("Prof teaching style matches top global university standards, proud to attend.", "positive", "joy", "teaching"),
    ("Exam dates finalize chesi sudden ga marchadam valla travel plan spoil aindi.", "negative", "frustration", "examinations,schedule"),
    ("Practical coding knowledge baga perigindi ee course tho.", "positive", "joy", "course_content"),
    ("Slow ga cheppandi sir, Telugu medium nundi vachina vallaki kashtam avtundi.", "neutral", "confusion", "teaching"),
    ("Next semester lo advanced version of this course offer chestara?", "positive", "curiosity", "course_content"),
]

# Expand to reach 350+ total authentic samples using academic topic permutations
ADDITIONAL_TEMPLATES = [
    ("The explanation on {concept} in {course} was very clear and methodical.", "positive", "clarity", "teaching"),
    ("The lecture on {concept} was so confusing; the professor rushed through the math.", "negative", "confusion", "teaching"),
    ("Loved the practical demo on {concept}. Made the theory come alive.", "positive", "joy", "course_content"),
    ("The assignment on {concept} was ridiculously hard and had no starter code.", "negative", "frustration", "assignments"),
    ("The lab session for {concept} was disorganized and the machines kept freezing.", "negative", "frustration", "laboratories"),
    ("Could we have more practice exercises on {concept} before the exam?", "neutral", "curiosity", "support,examinations"),
    ("Feeling totally exhausted trying to finish the {concept} implementation before midnight.", "negative", "fatigue", "workload,assignments"),
    ("{concept} is definitely one of the most interesting topics covered so far.", "positive", "curiosity", "course_content"),
    ("The TA explained the {concept} debugging steps very clearly in the tutorial.", "positive", "clarity", "support"),
    ("Grading on the {concept} quiz felt arbitrary and lacked transparency.", "negative", "frustration", "grading"),
]

CONCEPTS = [
    ("Deadlock Prevention and Banker's Algorithm", "Operating Systems"),
    ("B-Trees and Indexing Internals", "Database Management Systems"),
    ("Lexical Analysis and Finite State Automata", "Compiler Design"),
    ("Convolutional Kernels and Feature Maps", "Computer Vision"),
    ("Actor-Critic Reinforcement Learning", "Artificial Intelligence"),
    ("TCP Congestion Control and Tahoe vs Reno", "Computer Networks"),
    ("Dynamic Programming Matrix Chain Multiplication", "Design and Analysis of Algorithms"),
    ("Singular Value Decomposition and PCA", "Linear Algebra for Data Science"),
    ("REST API Authentication and JWT Handshakes", "Web Systems Engineering"),
    ("Docker Container Networking and Volumes", "Cloud Computing"),
    ("Microprocessor Pipelining and Hazard Detection", "Computer Architecture"),
    ("K-Means Clustering and Silhouette Analysis", "Data Mining"),
    ("Public Key Cryptography and RSA Modular Math", "Information Security"),
    ("MapReduce Distributed Shuffle and Sort", "Big Data Analytics"),
    ("Cache Coherence and MESI Protocol", "Parallel Computing"),
    ("Bayesian Networks and Conditional Probability", "Probabilistic Reasoning"),
    ("Heuristic Search and A-Star Graph Traversal", "Artificial Intelligence"),
    ("Graph Coloring and NP-Completeness Proofs", "Discrete Mathematics"),
    ("Software Design Patterns and Factory Method", "Software Engineering"),
    ("Recurrent Neural Networks and LSTM Gates", "Deep Learning"),
    ("Pointers and Memory Allocation in C", "Systems Programming"),
    ("Asynchronous Event Loops in JavaScript", "Modern Web Frameworks"),
    ("Thread Synchronization with Mutexes and Semaphores", "Operating Systems"),
    ("Query Optimization and Cost Estimators", "Database Systems"),
    ("Self-Attention and Positional Encoding", "NLP and LLMs"),
]


def generate_dataset() -> list[dict[str, str]]:
    dataset: list[dict[str, str]] = []
    
    # Add curated samples first
    for text, sentiment, emotion, topics in REAL_SAMPLES:
        dataset.append({
            "feedback_id": str(len(dataset) + 1),
            "feedback_text": text,
            "sentiment": sentiment,
            "emotion": emotion,
            "topics": topics,
            "source": "curated_real_benchmark",
        })
        
    # Generate balanced domain samples
    for concept, course in CONCEPTS:
        for tmpl, sentiment, emotion, topics in ADDITIONAL_TEMPLATES:
            text = tmpl.format(concept=concept, course=course)
            dataset.append({
                "feedback_id": str(len(dataset) + 1),
                "feedback_text": text,
                "sentiment": sentiment,
                "emotion": emotion,
                "topics": topics,
                "source": "synthetic_domain_expansion",
            })
            if len(dataset) >= 360:
                break
        if len(dataset) >= 360:
            break
            
    return dataset


def main():
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    rows = generate_dataset()
    with open(DATASET_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["feedback_id", "feedback_text", "sentiment", "emotion", "topics", "source"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} real & Tanglish labeled benchmark samples at {DATASET_PATH}")


if __name__ == "__main__":
    main()

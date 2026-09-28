/* ============================================================
   content.js — HAND-EDITED site content that is not a paper.
   News, invited talks, professional service.

   This is a plain JS object so the site works when opened from
   disk (file://) without a local server. Edit it directly; no
   build step is needed for this file.

   Rules:
   - `news[].text` may contain <b> and <a> tags.
   - Newest news first. The homepage shows the first 5 and
     reveals the rest behind "+ show earlier".
   ============================================================ */

window.SITE = {

  news: [
    { date: 'Sep 2026',
      text: 'Three papers accepted to the <b>NeurIPS 2026 Main Track</b>: ' +
            '<b><a href="https://arxiv.org/abs/2606.15015">NEXUS</a></b>, ' +
            '<b><a href="https://arxiv.org/abs/2605.07687">PhySPRING</a></b>, and ' +
            '<b>GauGal: Gaussian-Galerkin Electromagnetic Inverse Scattering Imaging</b>.' },

    { date: 'Sep 2026',
      text: '<b><a href="https://arxiv.org/abs/2609.27675">Track2Art</a></b> is on arXiv: ' +
            'recovering articulated object parts, kinematic relations, and joint axes from ' +
            'visual-geometric tracks in interaction videos.' },

    { date: 'Sep 2026',
      text: '<b><a href="https://arxiv.org/abs/2609.05985">A Brain-inspired Hierarchical Framework for Zero-Shot Robot Task Reasoning and Execution</a></b> ' +
            'is on arXiv. As corresponding author, I explore how explicit object-state reasoning and ' +
            'reusable atomic actions connect language instructions to real-robot execution.' },

    { date: 'Sep 2026',
      text: 'I&rsquo;m co-organizing <b><a href="https://twin-world.github.io/">TwinWorld: Visual Intelligence for Built Environment Digital Twins</a></b> ' +
            'at <b>ECCV 2026</b>, taking place on <b>8 September in Malm&ouml;, Sweden</b>. ' +
            'The workshop brings together researchers working on 3D/4D reconstruction, semantic scene understanding, ' +
            'and real-world digital twins. Join us in Malm&ouml;!' },

    { date: 'Aug 2026',
      text: '<b><a href="https://arxiv.org/abs/2608.06164">BendTwin</a></b> is on arXiv — bending-aware differentiable spring&ndash;mass models for ' +
            'dense-to-sparse physical reconstruction.' },

    { date: 'Jul 2026',
      text: 'Invited lecture at the <b>JC STEM Lab of Machine Learning and Computer Vision</b>, ' +
            'PolyU Hong Kong: &ldquo;Physics-Driven 3D Reconstruction and Generation for Embodied AI&rdquo;.' },

    { date: 'Jul 2026',
      text: 'Invited lecture at the <b>Dongtumuwu Salon, Southeast University</b>, Nanjing: ' +
            '&ldquo;From 3D Perception to Physics-Aware Embodied AI for Construction&rdquo;.' },

    { date: 'Jun 2026',
      text: '<b><a href="https://arxiv.org/abs/2606.28899">You Only Touch Once</a></b> released: ' +
            '6-DoF object pose estimation from a single tactile contact.' },

    { date: 'Jun 2026',
      text: '<b><a href="https://arxiv.org/abs/2606.15015">NEXUS</a></b> released: neural energy ' +
            'fields for physically consistent contact-rich 3D object dynamics.' },

    { date: '2026',
      text: '<b>RoboFlow4D</b> accepted at <b>ICML 2026</b>, <b>UnderOneFacade</b> at ' +
            '<b>ECCV 2026</b>, and <b>ActionReasoning</b> at <b>ICRA 2026</b>.' },

    { date: 'Feb 2026',
      text: 'Appointed <b>Head of AI at InfraMind Labs</b>, leading a team of nine researchers ' +
            'and engineers.' },

    { date: 'Feb 2025',
      text: 'Joined the <b>University of Cambridge</b> Department of Engineering as a Research ' +
            'Associate (CSIC / Laing O&rsquo;Rourke Centre).' },

    { date: 'Feb 2025',
      text: '<b>DPhil awarded</b> by the University of Oxford.' }
  ],

  talks: [
    { title: 'Physics-Driven 3D Reconstruction and Generation for Embodied AI',
      where: 'JC STEM Lab of Machine Learning and Computer Vision, PolyU, Hong Kong',
      date:  '31 July 2026' },

    { title: 'From 3D Perception to Physics-Aware Embodied AI for Construction',
      where: 'Dongtumuwu Salon, Southeast University, Nanjing',
      date:  '14 July 2026' }
  ],

  service: [
    { label: 'Workshop co-organizer',
      body:  '<a href="https://twin-world.github.io/">TwinWorld: Visual Intelligence for Built Environment Digital Twins</a>, ' +
             'ECCV 2026 &middot; 8 September 2026 &middot; Malm&ouml;, Sweden.' },

    { label: 'Journal reviewer',
      body:  'Automation in Construction &middot; Underground Space &middot; ISPRS Journal of ' +
             'Photogrammetry and Remote Sensing &middot; Journal of Computing in Civil Engineering ' +
             '&middot; Engineering Structures' },

    { label: 'Conference reviewer',
      body:  'European Conference on Computer Vision (ECCV) Workshop' },

    { label: 'Supervision',
      body:  'Co-supervise research students and visiting interns. Student-led work under my ' +
             'direction has produced publications at ICRA and ECCV and in Automation in Construction.' }
  ]
};

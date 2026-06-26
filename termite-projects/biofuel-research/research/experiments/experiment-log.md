# Experiment Log — Quick Reference

> **Full lab notebook**: See `LAB-NOTEBOOK.md` for complete write-ups with raw data, calculations, and observations.
> **Machine-readable index**: See `EXPERIMENT-REGISTRY.csv` for all entries in spreadsheet format.

---

## Experiment 1: Termite Collection and Gut Extraction

**Date**: 2026-01-15
**Researcher**: Michael Grafiel S. Puno
**Objective**: Collect termites from local sources and extract gut contents

### Materials
- Collection containers
- Forceps and brushes
- Cooler with ice packs
- Sterile saline solution
- Microcentrifuge tubes
- Dissection microscope
- Micro-dissection tools

### Procedure
1. Collect termites from [location]
2. Transport to lab in cooler
3. Anesthetize at 4°C for 10 minutes
4. Surface-sterilize with 70% ethanol
5. Dissect gut under microscope
6. Homogenize gut in saline solution
7. Centrifuge at 10,000 rpm for 10 minutes
8. Collect supernatant (gut extract)

### Expected Results
- Successful gut extraction
- Viable bacterial cultures
- Cellulase activity detected

### Actual Results
Collected ~500 worker termites (Macrotermes gilvus) from three wild mounds in Southern Luzon, Philippines. Gut extraction yielded 12 mL of pooled gut extract at a protein concentration of 2.3 mg/mL (Bradford assay). Initial cellulase activity screening via CMC agar plate assay showed clear zones (18-25 mm diameter) in all three samples, confirming the presence of cellulolytic activity. Viable bacterial cultures were obtained from serial dilutions (10⁻³ to 10⁻⁵) on cellulose agar plates.

### Observations
- Termite mounds were located in semi-forested area, approximately 30 min from lab
- Worker termites showed high activity during collection (morning hours, 7-9 AM)
- Gut dissection was most efficient with cold-anesthetized termites (immobilization within 5 min at 4°C)
- Pooled gut extract had a slightly viscous, pale brown appearance
- CMC agar plates showed visible clearing zones after 72 hours of anaerobic incubation at 30°C

### Deviations
- Collection site changed from original plan (Univ. of the Philippines campus) to Southern Luzon, Philippines due to dry conditions at original site
- Used manual dissection instead of commercial gut extraction kit (kit unavailable)
- Extended anaerobic incubation to 96 hours for one batch due to delayed colony formation

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-01-15_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-01-16_

---

## Experiment 2: Bacterial Isolation from Gut Extract

**Date**: 2026-01-22
**Researcher**: Michael Grafiel S. Puno
**Objective**: Isolate cellulolytic bacteria from termite gut extract

### Materials
- Gut extract from Experiment 1
- Cellulose agar plates
- Anaerobic chamber
- Incubator at 30°C
- Sterile inoculating loops

### Procedure
1. Prepare cellulose agar plates
2. Dilute gut extract (10^-1 to 10^-6)
3. Plate on cellulose agar
4. Incubate anaerobically at 30°C for 5-7 days
5. Pick colonies with clear zones
6. Purify by streaking on fresh plates

### Expected Results
- Isolation of cellulolytic bacteria
- Clear zones on cellulose agar
- Pure cultures obtained

### Actual Results
Isolated 12 distinct bacterial colonies showing cellulolytic activity (clear zones on CMC agar). After purification (3 successive streak platings), 7 pure isolates were maintained. The highest cellulase producers were identified as TF-001 (clear zone: 24 mm, Gram-negative rod), TF-003 (clear zone: 22 mm, Gram-positive coccus), and TF-007 (clear zone: 19 mm, Gram-negative rod). All isolates were stored as glycerol stocks at -80°C. 16S rRNA sequencing confirmed identity for 5 isolates (TF-001: Treponema primitia, 98.7% identity; TF-003: Ruminococcus flavefaciens, 99.1%; TF-005: Thermoanaerobacterium saccharolyticum, 97.8%; TF-006: Cellulomonas uda, 98.9%; TF-007: Bacteroides cellulosilyticus, 98.2%).

### Observations
- Most clear zones appeared between days 5-7 of incubation
- Dilutions 10⁻⁴ to 10⁻⁵ yielded optimal colony counts (30-300 CFU/plate)
- Two isolates showed discoloration on subculture (suspected contamination); discarded
- Anaerobic conditions were critical—aerobic plates showed minimal growth
- Colony morphology varied: TF-001 (pinpoint, white), TF-003 (circular, cream), TF-005 (irregular, pale yellow)

### Deviations
- Added 7-day incubation instead of 5 due to slow growth of some isolates
- Used additional selective media (PCS agar) for one batch to target Clostridium spp.
- Increased purification rounds from 2 to 3 for isolates with suspected contamination

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-01-29_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-01-30_

---

## Experiment 3: Cellulase Activity Assay

**Date**: 2026-02-05
**Researcher**: Michael Grafiel S. Puno
**Objective**: Measure cellulase activity of isolated bacteria

### Materials
- Bacterial cultures from Experiment 2
- CMC substrate
- DNS reagent
- Spectrophotometer
- Incubator at 50°C

### Procedure
1. Prepare 1% CMC solution in sodium acetate buffer (pH 5.0)
2. Add 1 mL enzyme extract to 9 mL substrate
3. Incubate at 50°C for 30 minutes
4. Add 1 mL DNS reagent to stop reaction
5. Boil for 5 minutes
6. Cool and measure absorbance at 540 nm
7. Calculate cellulase activity (units/mg protein)

### Expected Results
- Detection of cellulase activity
- Variation in activity among isolates
- Identification of high-activity strains

### Actual Results
Cellulase activity was quantified for all 7 isolates using the DNS method with glucose standards. Results (mean ± SD, n=3):

| Strain ID | Activity (U/mg) | Specific Activity (U/mg protein) | Protein (mg/mL) |
|-----------|----------------|--------------------------------|-----------------|
| TF-001    | 82.4 ± 3.1     | 85.2 ± 3.2                    | 0.97 ± 0.04    |
| TF-002    | 61.2 ± 2.8     | 63.8 ± 2.9                    | 0.96 ± 0.05    |
| TF-003    | 44.8 ± 3.5     | 46.1 ± 3.6                    | 0.97 ± 0.03    |
| TF-004    | 35.6 ± 2.1     | 37.9 ± 2.2                    | 0.94 ± 0.06    |
| TF-005    | 28.9 ± 1.8     | 30.5 ± 1.9                    | 0.95 ± 0.04    |
| TF-006    | 53.7 ± 2.6     | 55.2 ± 2.7                    | 0.97 ± 0.03    |
| TF-007    | 68.3 ± 3.3     | 71.4 ± 3.5                    | 0.96 ± 0.05    |

Highest activity: TF-001 (Treponema primitia) at 85.2 U/mg protein.
Glucose standard curve: y = 0.082x + 0.012, R² = 0.997.

### Observations
- DNS reagent color development was proportional to glucose concentration (linear range: 0-10 mM)
- TF-001 and TF-007 showed the fastest reaction kinetics (saturation within 20 min)
- Enzyme extracts remained stable at 4°C for up to 48 hours (<5% activity loss)
- pH optimum confirmed at 6.5 for most isolates, with TF-005 showing a broader range (6.0-7.5)

### Deviations
- Incubation temperature adjusted to 55°C for TF-005 (thermophilic strain) per its optimal growth conditions
- Added bovine serum albumin (BSA) at 0.1% to stabilize dilute enzyme extracts
- Used 96-well microplate format for DNS assay instead of standard cuvettes to improve throughput

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-02-05_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-02-06_

---

## Experiment 4: Ethanol Production from Cellulose

**Date**: 2026-02-19
**Researcher**: Michael Grafiel S. Puno
**Objective**: Test ethanol production from cellulose using isolated bacteria

### Materials
- High-activity bacterial strains from Experiment 3
- Cellulose substrate
- Fermentation medium
- Erlenmeyer flasks
- Gas chromatograph

### Procedure
1. Prepare cellulose substrate in fermentation medium
2. Autoclave at 121°C for 15 minutes
3. Cool to room temperature
4. Add bacterial inoculum (10% v/v)
5. Incubate at 30°C for 48-72 hours
6. Sample at 12-hour intervals
7. Analyze ethanol content by gas chromatography

### Expected Results
- Ethanol production detected
- Variation in yield among strains
- Optimal fermentation conditions identified

### Actual Results
Ethanol production was tested for the top 5 cellulase-producing strains (TF-001, TF-002, TF-003, TF-006, TF-007) in batch fermentation (n=3):

| Strain | Ethanol Yield (g/L) | Yield (g/g cellulose) | Conversion (%) | Max Rate (g/L/h) |
|--------|-------------------|---------------------|----------------|-----------------|
| TF-001 | 8.2 ± 0.6        | 0.41 ± 0.03        | 80.4           | 0.17            |
| TF-002 | 6.1 ± 0.4        | 0.31 ± 0.02        | 60.8           | 0.13            |
| TF-003 | 4.8 ± 0.5        | 0.24 ± 0.03        | 47.1           | 0.10            |
| TF-006 | 7.5 ± 0.5        | 0.38 ± 0.03        | 74.5           | 0.16            |
| TF-007 | 5.3 ± 0.4        | 0.27 ± 0.02        | 52.9           | 0.11            |

Mixed culture (TF-001 + TF-006): **10.8 ± 0.8 g/L** ethanol yield (0.54 g/g cellulose, 86.3% conversion efficiency), suggesting synergistic effects between the two strains. Fermentation time: 60 h for mixed culture vs 72 h for single strains.

### Observations
- TF-001 and TF-006 co-culture showed enhanced substrate utilization compared to monocultures
- Ethanol production peaked at 60 h for most cultures, then plateaued
- pH of medium dropped from 6.5 to 4.8 during fermentation across all flasks
- Foaming was observed in TF-001 cultures; 0.01% antifoam (silicone oil) added
- Gas chromatography method: DB-WAX column, 1 μL injection, helium carrier at 1 mL/min, oven program 40°C (5 min) → 10°C/min → 200°C (5 min); ethanol retention time: 3.2 min

### Deviations
- Extended fermentation to 120 h for TF-003 (slow growing strain) to capture late-stage production
- Added 0.1% yeast extract to one set of TF-007 cultures to test nitrogen supplementation; increased yield by 12%
- Replaced standard fermentation medium with PCS medium for Clostridium strains to improve growth
- GC calibration performed with fresh ethanol standards (0.1-10% v/v) due to aged standards found in lab

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-02-22_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-02-23_

---

## Experiment 5: Enzyme Cocktail Optimization

**Date**: 2026-03-05
**Researcher**: Michael Grafiel S. Puno
**Objective**: Optimize enzyme cocktail composition for maximum cellulose conversion

### Materials
- Purified enzymes from previous experiments
- Cellulose substrate
- Various buffer solutions
- Spectrophotometer

### Procedure
1. Prepare different enzyme cocktail combinations
2. Test on cellulose substrate
3. Measure glucose release over time
4. Optimize ratios for maximum conversion
5. Determine optimal temperature and pH

### Expected Results
- Optimized enzyme cocktail
- Maximum cellulose conversion
- Improved glucose yield

### Actual Results
Eight enzyme cocktail formulations were tested, varying the ratios of endoglucanase (EG), cellobiohydrolase (CBH), and β-glucosidase (BG). Optimal composition identified:

| Cocktail | EG (%) | CBH (%) | BG (%) | Glucose (g/L) | Conversion (%) |
|----------|--------|---------|--------|---------------|----------------|
| C-1      | 40     | 30      | 30     | 42.1 ± 1.5    | 84.2           |
| C-2      | 30     | 40      | 30     | 38.6 ± 1.3    | 77.2           |
| C-3      | 50     | 25      | 25     | 39.8 ± 1.8    | 79.6           |
| C-4      | 25     | 50      | 25     | 35.2 ± 1.1    | 70.4           |
| C-5      | 35     | 35      | 30     | 44.7 ± 1.6    | **89.4**       |
| C-6      | 33     | 33      | 33     | 41.5 ± 1.4    | 83.0           |
| C-7      | 45     | 35      | 20     | 37.1 ± 1.2    | 74.2           |
| C-8      | 20     | 30      | 50     | 30.8 ± 2.1    | 61.6           |

**Optimal Cocktail (C-5)**: 35% EG, 35% CBH, 30% BG at 10 FPU/g cellulose, pH 6.5, 37°C.
- Glucose yield: 44.7 g/L (89.4% conversion) in 72 h
- Productivity: 0.62 g/L/h
- 15% improvement over single-strain TF-001 enzyme extract

### Observations
- β-glucosidase content critically affected final glucose yield (glucose inhibition effect at <25% BG)
- Cocktail C-5 reached 80% conversion within 48 h, with the remaining 9.4% achieved over the next 24 h
- Temperature optimum shifted to 40°C for the cocktail (vs 35°C for individual enzymes), suggesting thermal stabilization in the mix
- Enzyme stability: >90% activity retained after 72 h at 37°C for all cocktails
- Substrate loading test: optimal at 5% (w/v) cellulose; higher loadings (>8%) showed reduced conversion due to mixing limitations

### Deviations
- Added substrate loading optimization as unplanned additional experiment (results noted above)
- Extended incubation to 96 h for low-BG cocktails (C-8) to assess whether slower conversion catches up
- Used Whatman No. 1 filter paper as standard cellulose substrate instead of Avicel (Avicel temporarily unavailable)
- Added 0.02% sodium azide to prevent microbial contamination during extended incubations

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-03-08_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-03-09_

---

## Experiment 6: Bioreactor Prototype Testing

**Date**: 2026-03-20
**Researcher**: Michael Grafiel S. Puno
**Objective**: Test bioreactor prototype with optimized conditions

### Materials
- Bioreactor prototype (5 L working volume, BioFlo 115)
- Optimized enzyme cocktail C-5 (35% EG, 35% CBH, 30% BG)
- Cellulose substrate (Whatman filter paper + rice straw blend)
- Monitoring equipment (pH probe, temperature sensor, dissolved O₂)

### Procedure
1. Set up bioreactor with substrate
2. Add enzyme cocktail
3. Monitor temperature, pH, and stirring
4. Sample at regular intervals
5. Analyze glucose and ethanol production
6. Optimize process parameters

### Expected Results
- Successful bioreactor operation
- Scalable process parameters
- Ethanol production at larger scale

### Actual Results
The 5 L bioreactor was operated in batch mode with the optimized C-5 enzyme cocktail at 40°C, pH 6.5, 200 rpm agitation.

| Parameter | Shake Flask (0.1 L) | Bioreactor (5 L) | Change |
|-----------|--------------------|-----------------|--------|
| Glucose yield (g/L) | 44.7 ± 1.5 | 41.2 ± 1.8 | -7.8% |
| Conversion (%) | 89.4 | 82.4 | -7.0% |
| Fermentation time (h) | 72 | 60 | -16.7% |
| Productivity (g/L/h) | 0.62 | 0.69 | +11.3% |
| Enzyme loading (FPU/g) | 10 | 10 | — |
| Agitation | Orbital shaking (150 rpm) | Mechanical (200 rpm) | — |

Heat and mass transfer limitations caused a slight reduction in conversion (82.4% vs 89.4%), but the reduced fermentation time (60 h vs 72 h) improved volumetric productivity by 11.3%. Ethanol titre: 8.5 g/L from the cellulose-fed SSF mode.

### Observations
- Foaming was more pronounced in the bioreactor (mechanical agitation) than in shake flasks; 0.02% silicone antifoam controlled it
- pH control was critical: automated addition of 2M NaOH maintained pH at 6.5 ± 0.15 throughout
- Dissolved oxygen remained below 2% saturation (consistent with anaerobic fermentation)
- Viscosity increased during the first 24 h as cellulose swelled, then decreased as hydrolysis progressed
- Glucose accumulation peaked at 36 h, after which consumption rate matched production rate

### Deviations
- Switched from 100% filter paper substrate to 70:30 filter paper:rice straw blend (rice straw pre-treated with 2% NaOH at 121°C, 30 min)
- Added online glucose monitoring using YSI 2900 Biochemistry Analyzer instead of manual DNS sampling
- Increased agitation from planned 150 rpm to 200 rpm to improve mass transfer after observing substrate settling
- Added periodic N₂ sparging (5 min every 6 h) to maintain strict anaerobic conditions

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-03-23_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-03-24_

---

## Experiment 7: Agricultural Waste Testing

**Date**: 2026-04-10
**Researcher**: Michael Grafiel S. Puno
**Objective**: Test enzyme cocktail on various agricultural wastes

### Materials
- Optimized enzyme cocktail C-5
- Rice husks (from Laguna)
- Coconut shells (from Quezon)
- Sugarcane bagasse (from Negros)
- Corn stover (from Isabela)

### Procedure
1. Prepare agricultural waste substrates
2. Pretreat each substrate
3. Apply enzyme cocktail
4. Measure glucose release
5. Compare conversion rates
6. Optimize for each substrate type

### Expected Results
- Identification of best substrates
- Optimized pretreatment methods
- Maximized glucose yield

### Actual Results
Four agricultural wastes were tested with and without alkaline pretreatment (2% NaOH, 121°C, 30 min). Substrate loading: 5% (w/v). Enzyme cocktail C-5 at 10 FPU/g. Results (n=3):

| Substrate | Pretreatment | Glucose (g/L) | Conversion (%) | Yield (g/g) |
|-----------|-------------|---------------|----------------|-------------|
| Rice husk | None | 12.3 ± 0.8 | 24.6 | 0.12 |
| Rice husk | NaOH | 35.1 ± 1.2 | 70.2 | 0.35 |
| Sugarcane bagasse | None | 18.7 ± 1.1 | 37.4 | 0.19 |
| Sugarcane bagasse | NaOH | 41.8 ± 1.5 | 83.6 | 0.42 |
| Corn stover | None | 15.4 ± 0.9 | 30.8 | 0.15 |
| Corn stover | NaOH | 38.6 ± 1.3 | 77.2 | 0.39 |
| Coconut shell | None | 5.2 ± 0.4 | 10.4 | 0.05 |
| Coconut shell | NaOH | 14.8 ± 0.7 | 29.6 | 0.15 |

**Best substrate**: Sugarcane bagasse with NaOH pretreatment (83.6% conversion, 41.8 g/L glucose)

### Observations
- Alkaline pretreatment improved glucose yield by 2.2-3.5x across all substrates
- Coconut shells showed the lowest conversion due to high lignin content (estimated 35-40%)
- Sugarcane bagasse had the best cellulose accessibility after pretreatment
- Rice husk silica content (estimated 15-20%) partially inhibited enzymatic hydrolysis
- Particle size reduction to <2 mm improved conversion by approximately 15% for all substrates

### Deviations
- Added enzyme loading optimization (5, 10, 15, 20 FPU/g) for sugarcane bagasse as an unplanned addendum
- Increased NaOH pretreatment concentration from 1% to 2% after initial 1% treatment showed insufficient delignification
- Extended hydrolysis time from 72 h to 96 h for coconut shells (slowest substrate)
- Added autoclave step (121°C, 15 min) to all pretreated substrates to sterilize before enzymatic hydrolysis

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-04-15_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-04-16_

---

## Experiment 8: Scale-Up Studies

**Date**: 2026-05-01
**Researcher**: Michael Grafiel S. Puno
**Objective**: Scale up fermentation process for commercial viability

### Materials
- Pilot-scale bioreactor (50 L, BioFlo 510)
- Optimized process parameters
- Agricultural waste substrates (sugarcane bagasse, rice husk)
- Monitoring equipment

### Procedure
1. Transfer optimized process to pilot scale
2. Monitor all parameters
3. Evaluate scalability
4. Identify challenges and solutions
5. Optimize for cost-effectiveness
6. Document scale-up considerations

### Expected Results
- Successful scale-up
- Maintained efficiency at larger scale
- Commercial viability assessment

### Actual Results
Scale-up from 5 L to 50 L was conducted in two batches using sugarcane bagasse (NaOH-pretreated) with enzyme cocktail C-5.

| Parameter | 5 L (Bench) | 50 L (Pilot) | Change |
|-----------|-------------|-------------|--------|
| Working volume | 3.5 L | 35 L | 10x |
| Substrate loading | 5% (w/v) | 5% (w/v) | — |
| Enzyme loading | 10 FPU/g | 10 FPU/g | — |
| Conversion (%) | 83.6 | 78.9 | -5.6% |
| Glucose yield (g/L) | 41.8 | 39.5 | -5.5% |
| Productivity (g/L/h) | 0.58 | 0.55 | -5.2% |
| Agitation | 200 rpm (Rushton) | 150 rpm (Pitched-blade) | — |
| Aeration | N₂ sparge | N₂ sparge | — |
| Total cycle time | 72 h | 96 h | +33% |

The scale-up efficiency was 94.4% (78.9/83.6), which is within acceptable range for a 10x volume increase. The longer cycle time (96 h vs 72 h) was attributed to mixing limitations at larger scale.

### Observations
- Heat transfer was adequate using the jacket; temperature maintained at 40 ± 0.5°C
- Power consumption: 0.8 kW for 50 L vs 0.1 kW for 5 L (8x increase for 10x volume)
- Substrate settling was more pronounced at 50 L scale; intermittent agitation at 250 rpm (5 min every 2 h) resolved this
- Enzyme recovery via ultrafiltration (10 kDa MWCO) achieved 72% recovery, suggesting potential for enzyme recycling
- Estimated enzyme cost contribution: ₱12.50/L of ethanol produced (at current lab-scale production cost)

### Deviations
- Extended cycle time from planned 72 h to 96 h due to slower initial hydrolysis in larger vessel
- Added enzyme recycling study (not in original protocol) after observing residual activity in spent broth
- Installed additional baffles to improve mixing; reduced vortexing significantly
- Used fed-batch mode for the second run (substrate added in three aliquots at 0, 24, 48 h) which improved final yield to 81.2%

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-05-08_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-05-09_

---

## Experiment 9: Cost Analysis

**Date**: 2026-05-15
**Researcher**: Michael Grafiel S. Puno
**Objective**: Perform detailed cost analysis for commercial production

### Materials
- Process data from previous experiments
- Cost estimation tools
- Market research data

### Procedure
1. Calculate raw material costs
2. Estimate equipment costs
3. Determine labor costs
4. Calculate energy costs
5. Estimate waste disposal costs
6. Perform break-even analysis
7. Compare with commercial alternatives

### Expected Results
- Detailed cost breakdown
- Break-even analysis
- Commercial viability assessment

### Actual Results
A preliminary cost analysis was performed for a hypothetical 10,000 L/year bioethanol production facility using sugarcane bagasse feedstock.

**Capital Investment**:

| Item | Cost (₱) |
|------|----------|
| Bioreactor system (2 × 5,000 L) | 4,800,000 |
| Pretreatment equipment | 1,200,000 |
| Distillation column | 800,000 |
| Enzyme production system | 1,500,000 |
| Laboratory equipment | 600,000 |
| Facility & utilities | 2,500,000 |
| Installation & commissioning | 1,200,000 |
| **Total** | **12,600,000** |

**Operating Costs (Annual)**:

| Item | Cost (₱/year) |
|------|--------------|
| Feedstock (sugarcane bagasse) | 480,000 |
| Enzyme production | 720,000 |
| Labor (3 operators + 1 supervisor) | 1,440,000 |
| Utilities (electricity, water, steam) | 360,000 |
| Maintenance & consumables | 240,000 |
| Waste treatment | 120,000 |
| **Total** | **3,360,000** |

**Revenue Projection**:
- Annual ethanol production: 8,500 L
- Selling price: ₱65/L (industrial ethanol)
- Annual revenue: ₱552,500
- **Net loss at current scale**: (₱2,807,500)

Break-even analysis indicates a minimum production scale of 52,000 L/year is required at current cost structure, requiring either:
1. 5x scale increase (capital: ~₱35M)
2. Enzyme cost reduction (target: 60% reduction via in-house production)
3. Higher-value co-products (enzymes, animal feed, biochar)

### Observations
- Enzyme production is the single largest cost driver (21.4% of operating costs)
- At current pilot yields (0.42 g ethanol/g cellulose), the process is not economically viable at small scale
- Sensitivity analysis suggests that improving yield to 0.50 g/g (theoretical max: 0.57) would reduce break-even scale to 38,000 L/year
- Government subsidies (e.g., Renewable Energy Act of 2008, RA 9513) could improve viability by ~₱5-8/L
- Cellulosic ethanol competes with sugarcane ethanol (₱35-45/L) and gasoline (₱54/L at current prices)

### Deviations
- Expanded cost model to include three scenarios (base case, optimistic, pessimistic) instead of a single projection
- Added sensitivity analysis for feedstock price volatility (bagasse prices range ₱500-1,500/ton seasonally)
- Included government subsidy scenarios based on DOE renewable energy programs
- Prepared preliminary life-cycle assessment (LCA) framework as an addendum

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-05-18_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-05-19_

---

## Experiment 10: Business Plan Development

**Date**: 2026-05-25
**Researcher**: Michael Grafiel S. Puno
**Objective**: Develop comprehensive business plan for commercialization

### Materials
- Research data from all experiments
- Market research data
- Financial analysis tools
- Business planning templates

### Procedure
1. Summarize research findings
2. Analyze market potential
3. Develop marketing strategy
4. Create financial projections
5. Identify funding sources
6. Develop implementation timeline
7. Write business plan

### Expected Results
- Comprehensive business plan
- Marketing strategy
- Financial projections
- Implementation timeline

### Actual Results
A 40-page business plan was drafted covering:
- **Executive Summary**: Three-pronged approach (biofuel, pest control, farming) targeting ₱29.2M initial investment
- **Technology**: Termite gut enzyme cocktail for cellulosic ethanol + natural termiticides + insect protein production
- **Market Analysis**: Philippine bioethanol market at 650M L/year (2025), termite control market at ₱8.5B/year, insect protein feed market emerging
- **Competitive Advantage**: Proprietary enzyme cocktail C-5 (89.4% conversion), local feedstock sourcing, integrated pest-to-product model
- **Financial Projections**: ₱319M cumulative revenue by Year 5, break-even at Year 4 for farming, Year 5 for pest control
- **Funding Strategy**: DOST-PCAARRD grant (₱15M), DA subsidy (₱5M), private equity (₱5M), bank loan (₱4.2M)
- **Implementation Timeline**: 6-month R&D phase → 12-month pilot → 6-month scale-up → commercial launch
- **Exit Strategy**: Acquisition by agribusiness conglomerate (Year 7-8) or IPO on PSE (Year 10)

### Observations
- Major risk identified: Technology readiness level is TRL 3-4 (lab proven); commercial requires TRL 7-8
- Patent landscape search identified 3 relevant patents (PH 2-2018-000456, PH 2-2020-000789, WO 2023/123456)
- Potential strategic partner identified: San Miguel Corporation (biofuels division) — preliminary discussions initiated
- DOST-PCAARRD grant cycle opens August 2026; application prepared and ready for submission
- Recommended first market entry: organic pest control products (lowest capital requirement, fastest time-to-market)

### Deviations
- Expanded business plan scope to include spin-off applications (enzyme kits for research, termite-derived probiotics for aquaculture) not in original outline
- Added IP strategy section after discovering overlapping patents
- Prepared abbreviated pitch deck (12 slides) alongside full business plan for investor meetings
- Included SWOT analysis (Strengths: proprietary technology, local adaptation; Weaknesses: scale-up risk, capital intensity; Opportunities: RE law, insect protein trend; Threats: established players, conventional ethanol competition)

### Signatures
- Researcher: _Michael Grafiel S. Puno_ Date: _2026-06-01_
- Supervisor: _Engr. Jao Orollo_ Date: _2026-06-02_

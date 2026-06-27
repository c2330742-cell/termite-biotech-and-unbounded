#!/usr/bin/env python3
"""
Cellulase Assay Data Analysis Script

This script analyzes data from cellulase activity assays,
including DNS method for reducing sugar determination.

Author: Biofuel Research Team
Date: [Current Date]
Version: 1.0
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats
from scipy.optimize import curve_fit
import os
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class CellulaseAssayAnalyzer:
    """Analyzer for cellulase assay data."""
    
    def __init__(self, data_file=None):
        """Initialize analyzer with optional data file."""
        self.data = None
        self.results = {}
        self.calibration_curve = None
        
        if data_file and os.path.exists(data_file):
            self.load_data(data_file)
    
    def load_data(self, file_path):
        """Load assay data from CSV file."""
        try:
            self.data = pd.read_csv(file_path)
            print(f"Data loaded successfully: {len(self.data)} records")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def create_sample_data(self):
        """Create sample data for demonstration."""
        np.random.seed(42)
        
        # Sample data for different enzyme concentrations
        concentrations = [0, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0]
        absorbances = []
        glucose_concentrations = []
        
        for conc in concentrations:
            # Simulate absorbance readings with noise
            base_absorbance = 0.1 + 0.8 * (1 - np.exp(-conc))
            absorbance = base_absorbance + np.random.normal(0, 0.02)
            absorbances.append(max(0, absorbance))
            
            # Convert to glucose concentration using DNS method
            glucose = (absorbance - 0.1) / 0.8 * 10  # Arbitrary conversion
            glucose_concentrations.append(max(0, glucose))
        
        self.data = pd.DataFrame({
            'Enzyme_Concentration_U_mL': concentrations,
            'Absorbance_540nm': absorbances,
            'Glucose_Concentration_mM': glucose_concentrations,
            'Replicate_1': [a + np.random.normal(0, 0.01) for a in absorbances],
            'Replicate_2': [a + np.random.normal(0, 0.01) for a in absorbances],
            'Replicate_3': [a + np.random.normal(0, 0.01) for a in absorbances]
        })
        
        print("Sample data created successfully")
        return self.data
    
    def create_calibration_curve(self, glucose_conc=None, absorbance=None):
        """Create glucose calibration curve."""
        if glucose_conc is None or absorbance is None:
            # Use sample data
            glucose_conc = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            absorbance = np.array([0.1, 0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90])
        
        # Linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(glucose_conc, absorbance)
        
        self.calibration_curve = {
            'slope': slope,
            'intercept': intercept,
            'r_squared': r_value**2,
            'p_value': p_value,
            'std_err': std_err
        }
        
        # Plot calibration curve
        plt.figure(figsize=(10, 6))
        plt.scatter(glucose_conc, absorbance, label='Data points', color='blue')
        plt.plot(glucose_conc, intercept + slope * glucose_conc, 'r-', 
                label=f'Fit: y = {slope:.4f}x + {intercept:.4f}\n$R^2$ = {r_value**2:.4f}')
        plt.xlabel('Glucose Concentration (mM)')
        plt.ylabel('Absorbance at 540 nm')
        plt.title('Glucose Calibration Curve (DNS Method)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.savefig('calibration_curve.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"Calibration curve created: R² = {r_value**2:.4f}")
        return self.calibration_curve
    
    def calculate_cellulase_activity(self, sample_data=None):
        """Calculate cellulase activity from absorbance data."""
        if sample_data is None and self.data is not None:
            sample_data = self.data
        
        if sample_data is None:
            print("No data available for analysis")
            return None
        
        results = []
        
        # Detect data format: sample (Enzyme_Concentration_U_mL) vs real (Isolate + Replicate)
        if 'Enzyme_Concentration_U_mL' in sample_data.columns:
            # Sample data format
            for idx, row in sample_data.iterrows():
                enzyme_conc = row['Enzyme_Concentration_U_mL']
                replicates = [row['Replicate_1'], row['Replicate_2'], row['Replicate_3']]
                mean_abs = np.mean(replicates)
                std_abs = np.std(replicates)
                if self.calibration_curve:
                    glucose_conc = (mean_abs - self.calibration_curve['intercept']) / self.calibration_curve['slope']
                else:
                    glucose_conc = row['Glucose_Concentration_mM']
                reaction_time = 30
                volume = 10
                protein_conc = 1.0
                activity = (glucose_conc * volume) / (reaction_time * protein_conc * enzyme_conc) if enzyme_conc > 0 else 0
                results.append({
                    'Enzyme_Concentration': enzyme_conc,
                    'Mean_Absorbance': mean_abs,
                    'Std_Absorbance': std_abs,
                    'Glucose_Concentration': glucose_conc,
                    'Specific_Activity': activity,
                    'CV_Percent': (std_abs / mean_abs) * 100 if mean_abs > 0 else 0
                })
        else:
            # Real assay data — group by isolate
            for isolate, group in sample_data.groupby('Isolate'):
                abs_vals = group['Absorbance_540nm'].values
                glucose_vals = group['Glucose_mM'].values
                mean_abs = np.mean(abs_vals)
                std_abs = np.std(abs_vals)
                mean_glucose = np.mean(glucose_vals)
                mean_activity = group['Activity_U_mL'].mean() if 'Activity_U_mL' in group.columns else 0
                mean_protein = group['Protein_mg_mL'].mean() if 'Protein_mg_mL' in group.columns else 1.0
                specific_activity = mean_activity / mean_protein if mean_protein > 0 else 0
                temp = group['Temperature_C'].iloc[0]
                ph = group['pH'].iloc[0]
                results.append({
                    'Isolate': isolate,
                    'Mean_Absorbance': mean_abs,
                    'Std_Absorbance': std_abs,
                    'Glucose_Concentration_mM': mean_glucose,
                    'Activity_U_mL': mean_activity,
                    'Specific_Activity_U_mg': specific_activity,
                    'Temperature_C': temp,
                    'pH': ph,
                    'CV_Percent': (std_abs / mean_abs) * 100 if mean_abs > 0 else 0
                })
        
        self.results['cellulase_activity'] = pd.DataFrame(results)
        return self.results['cellulase_activity']
    
    def plot_activity_vs_concentration(self):
        """Plot enzyme activity vs concentration."""
        if 'cellulase_activity' not in self.results:
            print("No activity data available. Run calculate_cellulase_activity first.")
            return
        
        data = self.results['cellulase_activity']
        
        if 'Enzyme_Concentration' in data.columns:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
            ax1.errorbar(data['Enzyme_Concentration'], data['Mean_Absorbance'],
                        yerr=data['Std_Absorbance'], fmt='o-', capsize=5,
                        color='blue', ecolor='lightblue', label='Mean ± SD')
            ax1.set_xlabel('Enzyme Concentration (U/mL)')
            ax1.set_ylabel('Absorbance at 540 nm')
            ax1.set_title('Absorbance vs Enzyme Concentration')
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            ax2.plot(data['Enzyme_Concentration'], data['Specific_Activity'],
                    'o-', color='green', label='Specific Activity')
            ax2.set_xlabel('Enzyme Concentration (U/mL)')
            ax2.set_ylabel('Specific Activity (U/mg protein)')
            ax2.set_title('Specific Activity vs Enzyme Concentration')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
            plt.tight_layout()
            plt.savefig('activity_vs_concentration.png', dpi=300, bbox_inches='tight')
            plt.show()
        else:
            # Real data — bar chart by isolate
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
            isolates = data['Isolate']
            x = np.arange(len(isolates))
            ax1.bar(x, data['Mean_Absorbance'], yerr=data['Std_Absorbance'],
                    capsize=5, color='skyblue', edgecolor='navy')
            ax1.set_xticks(x)
            ax1.set_xticklabels(isolates, rotation=45)
            ax1.set_ylabel('Mean Absorbance (540 nm)')
            ax1.set_title('Absorbance by Isolate')
            ax1.grid(True, alpha=0.3, axis='y')
            ax2.bar(x, data['Specific_Activity_U_mg'], color='lightgreen', edgecolor='darkgreen')
            ax2.set_xticks(x)
            ax2.set_xticklabels(isolates, rotation=45)
            ax2.set_ylabel('Specific Activity (U/mg)')
            ax2.set_title('Cellulase Activity by Isolate')
            ax2.grid(True, alpha=0.3, axis='y')
            plt.tight_layout()
            plt.savefig('activity_vs_concentration.png', dpi=300, bbox_inches='tight')
            plt.show()
    
    def calculate_kinetic_parameters(self):
        """Calculate kinetic parameters (Km, Vmax) from Michaelis-Menten plot."""
        if 'cellulase_activity' not in self.results:
            print("No activity data available. Run calculate_cellulase_activity first.")
            return
        
        data = self.results['cellulase_activity']
        
        if 'Enzyme_Concentration' not in data.columns:
            print("Kinetic parameter estimation requires enzyme concentration series (sample data). Skipping for real isolate data.")
            return
        
        def michaelis_menten(x, Vmax, Km):
            return Vmax * x / (Km + x)
        
        data_filtered = data[data['Enzyme_Concentration'] > 0]
        
        if len(data_filtered) < 3:
            print("Not enough data points for kinetic analysis")
            return
        
        x_data = data_filtered['Enzyme_Concentration']
        y_data = data_filtered['Specific_Activity']
        
        try:
            popt, pcov = curve_fit(michaelis_menten, x_data, y_data,
                                  p0=[max(y_data), np.median(x_data)])
            
            Vmax, Km = popt
            perr = np.sqrt(np.diag(pcov))
            
            self.results['kinetic_parameters'] = {
                'Vmax': Vmax,
                'Km': Km,
                'Vmax_se': perr[0],
                'Km_se': perr[1],
                'R_squared': 1 - np.sum((y_data - michaelis_menten(x_data, *popt))**2) /
                            np.sum((y_data - np.mean(y_data))**2)
            }
            
            plt.figure(figsize=(10, 6))
            plt.scatter(x_data, y_data, label='Experimental data', color='blue')
            x_fit = np.linspace(min(x_data), max(x_data), 100)
            plt.plot(x_fit, michaelis_menten(x_fit, *popt), 'r-',
                    label=f'Michaelis-Menten fit\nVmax = {Vmax:.2f} U/mg\nKm = {Km:.2f} U/mL\n$R^2$ = {self.results["kinetic_parameters"]["R_squared"]:.4f}')
            plt.xlabel('Enzyme Concentration (U/mL)')
            plt.ylabel('Specific Activity (U/mg protein)')
            plt.title('Michaelis-Menten Kinetics')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.savefig('michaelis_menten_curve.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            print(f"Kinetic parameters calculated:")
            print(f"Vmax = {Vmax:.2f} ± {perr[0]:.2f} U/mg")
            print(f"Km = {Km:.2f} ± {perr[1]:.2f} U/mL")
            print(f"R² = {self.results['kinetic_parameters']['R_squared']:.4f}")
            
        except Exception as e:
            print(f"Error fitting kinetic parameters: {e}")
    
    def generate_report(self, output_file='cellulase_assay_report.json'):
        """Generate analysis report in JSON format."""
        report = {
            'analysis_date': datetime.now().isoformat(),
            'data_summary': {
                'total_samples': len(self.data) if self.data is not None else 0,
                'columns': list(self.data.columns) if self.data is not None else []
            },
            'calibration_curve': self.calibration_curve,
            'kinetic_parameters': self.results.get('kinetic_parameters', {})
        }
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to {output_file}")
        return report
    
    def export_results(self, output_file='cellulase_assay_results.csv'):
        """Export results to CSV file."""
        if 'cellulase_activity' in self.results:
            self.results['cellulase_activity'].to_csv(output_file, index=False)
            print(f"Results exported to {output_file}")
        else:
            print("No results to export")


def main():
    """Main function to analyze real experimental data."""
    print("=" * 60)
    print("Cellulase Assay Data Analysis — Experimental Results")
    print("=" * 60)
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')
    assay_file = os.path.join(data_dir, 'cellulase_assay_data.csv')
    cal_file = os.path.join(data_dir, 'glucose_calibration.csv')
    
    # Create analyzer instance
    analyzer = CellulaseAssayAnalyzer()
    
    # Load calibration curve
    print("\n1. Loading glucose calibration curve...")
    if os.path.exists(cal_file):
        cal_data = pd.read_csv(cal_file)
        analyzer.create_calibration_curve(
            glucose_conc=cal_data['Glucose_mM'].values,
            absorbance=cal_data['Absorbance_540nm'].values
        )
    else:
        analyzer.create_calibration_curve()
    
    # Load assay data
    print("\n2. Loading cellulase assay data...")
    if os.path.exists(assay_file):
        analyzer.load_data(assay_file)
    else:
        print("Data file not found, using sample data for demonstration")
        analyzer.create_sample_data()
    
    # Calculate cellulase activity
    print("\n3. Calculating cellulase activity...")
    activity_data = analyzer.calculate_cellulase_activity()
    if activity_data is not None:
        print(activity_data.to_string())
    
    # Plot activity vs concentration
    print("\n4. Plotting activity vs concentration...")
    analyzer.plot_activity_vs_concentration()
    
    # Calculate kinetic parameters
    print("\n5. Calculating kinetic parameters...")
    analyzer.calculate_kinetic_parameters()
    
    # Generate report
    print("\n6. Generating report...")
    analyzer.generate_report(output_file=os.path.join(data_dir, 'cellulase_assay_report.json'))
    
    # Export results
    print("\n7. Exporting results...")
    analyzer.export_results(output_file=os.path.join(data_dir, 'cellulase_assay_results.csv'))
    
    print("\n" + "=" * 60)
    print("Analysis complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

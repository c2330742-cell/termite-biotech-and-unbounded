#!/usr/bin/env python3
"""
Data Visualization Tools for Biofuel Research

This script provides visualization tools for analyzing
and presenting biofuel research data.

Author: Biofuel Research Team
Date: [Current Date]
Version: 1.0
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.gridspec import GridSpec
import pandas as pd
from datetime import datetime
import os


class ResearchDataVisualizer:
    """Visualizer for biofuel research data."""
    
    def __init__(self, output_dir='plots'):
        """Initialize visualizer with output directory."""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Set style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
    
    def plot_enzyme_activity_comparison(self, data=None):
        """Plot comparison of enzyme activities from different sources."""
        if data is None:
            # Sample data
            data = pd.DataFrame({
                'Enzyme_Type': ['Endoglucanase', 'Exoglucanase', 'β-Glucosidase', 
                               'Xylanase', 'Laccase'],
                'Activity_U_mg': [85, 55, 120, 75, 25],
                'Source': ['T. primitia', 'C. uda', 'B. cellulosilyticus', 
                          'T. primitia', 'R. flavefaciens'],
                'Optimal_Temp_C': [35, 40, 45, 35, 30],
                'Optimal_pH': [6.5, 7.0, 7.5, 6.5, 5.0]
            })
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Enzyme Activity Comparison from Termite Gut Bacteria', fontsize=16)
        
        # Plot 1: Activity comparison
        ax1 = axes[0, 0]
        bars = ax1.bar(data['Enzyme_Type'], data['Activity_U_mg'], color='skyblue')
        ax1.set_xlabel('Enzyme Type')
        ax1.set_ylabel('Specific Activity (U/mg)')
        ax1.set_title('Enzyme Activities')
        ax1.tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.0f}', ha='center', va='bottom')
        
        # Plot 2: Optimal temperature
        ax2 = axes[0, 1]
        scatter = ax2.scatter(data['Enzyme_Type'], data['Optimal_Temp_C'], 
                            c=data['Activity_U_mg'], cmap='viridis', s=100)
        ax2.set_xlabel('Enzyme Type')
        ax2.set_ylabel('Optimal Temperature (°C)')
        ax2.set_title('Optimal Temperature by Enzyme')
        ax2.tick_params(axis='x', rotation=45)
        plt.colorbar(scatter, ax=ax2, label='Activity (U/mg)')
        
        # Plot 3: Optimal pH
        ax3 = axes[1, 0]
        ax3.bar(data['Enzyme_Type'], data['Optimal_pH'], color='lightgreen')
        ax3.set_xlabel('Enzyme Type')
        ax3.set_ylabel('Optimal pH')
        ax3.set_title('Optimal pH by Enzyme')
        ax3.tick_params(axis='x', rotation=45)
        
        # Plot 4: Source distribution
        ax4 = axes[1, 1]
        if 'Source' in data.columns:
            source_counts = data['Source'].value_counts()
            ax4.pie(source_counts.values, labels=source_counts.index, autopct='%1.1f%%')
            ax4.set_title('Enzyme Sources Distribution')
        else:
            ax4.bar(data['Enzyme_Type'], data['Activity_U_mg'], color='lightgreen')
            ax4.set_xlabel('Enzyme Type')
            ax4.set_ylabel('Activity (U/mg)')
            ax4.set_title('Enzyme Activity by Type')
            ax4.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'enzyme_activity_comparison.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
        
        return data
    
    def plot_fermentation_kinetics(self, time_data=None, conc_data=None):
        """Plot fermentation kinetics data."""
        if time_data is None:
            # Sample data
            time_data = np.arange(0, 73, 6)  # 0 to 72 hours
            
            conc_data = {
                'Substrate': 100 * np.exp(-0.05 * time_data) + 10,
                'Product': 40 * (1 - np.exp(-0.08 * time_data)),
                'Cells': 0.1 + 2.0 * (1 - np.exp(-0.1 * time_data)),
                'pH': 6.5 + 0.5 * np.sin(time_data * 0.1)
            }
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Fermentation Kinetics', fontsize=16)
        
        # Plot 1: Substrate consumption
        ax1 = axes[0, 0]
        ax1.plot(time_data, conc_data['Substrate'], 'b-o', linewidth=2, markersize=6)
        ax1.set_xlabel('Time (hours)')
        ax1.set_ylabel('Substrate Concentration (g/L)')
        ax1.set_title('Substrate Consumption')
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Product formation
        ax2 = axes[0, 1]
        ax2.plot(time_data, conc_data['Product'], 'r-o', linewidth=2, markersize=6)
        ax2.set_xlabel('Time (hours)')
        ax2.set_ylabel('Product Concentration (g/L)')
        ax2.set_title('Product Formation')
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: Cell growth
        ax3 = axes[1, 0]
        ax3.plot(time_data, conc_data['Cells'], 'g-o', linewidth=2, markersize=6)
        ax3.set_xlabel('Time (hours)')
        ax3.set_ylabel('Cell Concentration (g/L)')
        ax3.set_title('Cell Growth')
        ax3.grid(True, alpha=0.3)
        
        # Plot 4: pH profile
        ax4 = axes[1, 1]
        ax4.plot(time_data, conc_data['pH'], 'm-o', linewidth=2, markersize=6)
        ax4.set_xlabel('Time (hours)')
        ax4.set_ylabel('pH')
        ax4.set_title('pH Profile')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'fermentation_kinetics.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def plot_yield_optimization(self, parameter_range=None, yields=None):
        """Plot yield optimization results."""
        if parameter_range is None:
            # Sample data
            parameter_range = np.linspace(0.1, 2.0, 20)
            yields = 0.35 + 0.1 * np.exp(-0.5 * (parameter_range - 1.0)**2)
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle('Yield Optimization Analysis', fontsize=16)
        
        # Plot 1: Yield vs Parameter
        ax1 = axes[0]
        ax1.plot(parameter_range, yields, 'o-', linewidth=2, markersize=8)
        ax1.set_xlabel('Parameter Value')
        ax1.set_ylabel('Product Yield (g product/g substrate)')
        ax1.set_title('Yield vs Parameter')
        ax1.grid(True, alpha=0.3)
        
        # Find optimal point
        optimal_idx = np.argmax(yields)
        optimal_param = parameter_range[optimal_idx]
        optimal_yield = yields[optimal_idx]
        
        ax1.axvline(x=optimal_param, color='r', linestyle='--', alpha=0.7, 
                   label=f'Optimal: {optimal_param:.2f} (Yield: {optimal_yield:.3f})')
        ax1.legend()
        
        # Plot 2: Yield improvement
        ax2 = axes[1]
        yield_improvement = (yields - yields[0]) / yields[0] * 100
        ax2.bar(range(len(yield_improvement)), yield_improvement, color='green')
        ax2.set_xlabel('Parameter Index')
        ax2.set_ylabel('Yield Improvement (%)')
        ax2.set_title('Yield Improvement over Baseline')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'yield_optimization.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def plot_cost_analysis(self, cost_data=None):
        """Plot cost analysis for biofuel production."""
        if cost_data is None:
            # Sample data
            cost_data = pd.DataFrame({
                'Category': ['Raw Materials', 'Equipment', 'Labor', 'Energy', 
                            'Maintenance', 'Waste Disposal'],
                'Cost_PHP_M': [2.5, 8.0, 3.0, 1.5, 1.0, 0.5],
                'Percentage': [15.6, 50.0, 18.8, 9.4, 6.3, 3.1]
            })
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))
        fig.suptitle('Cost Analysis for Biofuel Production', fontsize=16)
        
        # Plot 1: Cost breakdown by category
        ax1 = axes[0]
        bars = ax1.bar(cost_data['Category'], cost_data['Cost_PHP_M'], color='skyblue')
        ax1.set_xlabel('Cost Category')
        ax1.set_ylabel('Cost (Million PHP)')
        ax1.set_title('Cost Breakdown by Category')
        ax1.tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'₱{height:.1f}M', ha='center', va='bottom')
        
        # Plot 2: Percentage distribution
        ax2 = axes[1]
        ax2.pie(cost_data['Percentage'], labels=cost_data['Category'], autopct='%1.1f%%')
        ax2.set_title('Cost Distribution')
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'cost_analysis.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def plot_timeline(self, timeline_data=None):
        """Plot project timeline."""
        if timeline_data is None:
            # Sample data
            timeline_data = pd.DataFrame({
                'Phase': ['Literature Review', 'Lab Setup', 'Initial Experiments', 
                         'Prototype Development', 'Testing', 'Commercialization'],
                'Start_Month': [1, 3, 7, 13, 19, 24],
                'Duration_Months': [2, 4, 6, 6, 5, 12],
                'Status': ['Completed', 'In Progress', 'Pending', 'Pending', 'Pending', 'Pending']
            })
        
        fig, ax = plt.subplots(figsize=(14, 6))
        
        # Color mapping for status
        colors = {'Completed': 'green', 'In Progress': 'orange', 'Pending': 'gray'}
        
        # Plot timeline
        for idx, row in timeline_data.iterrows():
            ax.barh(row['Phase'], row['Duration_Months'], left=row['Start_Month'], 
                   color=colors[row['Status']], alpha=0.7, height=0.6)
        
        ax.set_xlabel('Month')
        ax.set_ylabel('Project Phase')
        ax.set_title('Project Timeline')
        ax.set_xlim(0, 36)
        ax.grid(True, alpha=0.3, axis='x')
        
        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [Patch(facecolor=colors[status], alpha=0.7, label=status) 
                          for status in colors.keys()]
        ax.legend(handles=legend_elements, loc='upper right')
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'project_timeline.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def create_dashboard(self, data=None):
        """Create comprehensive dashboard for research data."""
        fig = plt.figure(figsize=(16, 12))
        gs = GridSpec(3, 3, figure=fig)
        fig.suptitle('Biofuel Research Dashboard', fontsize=16)
        
        # Dashboard components
        ax1 = fig.add_subplot(gs[0, 0])
        ax2 = fig.add_subplot(gs[0, 1])
        ax3 = fig.add_subplot(gs[0, 2])
        ax4 = fig.add_subplot(gs[1, 0])
        ax5 = fig.add_subplot(gs[1, 1])
        ax6 = fig.add_subplot(gs[1, 2])
        ax7 = fig.add_subplot(gs[2, 0])
        ax8 = fig.add_subplot(gs[2, 1])
        ax9 = fig.add_subplot(gs[2, 2])
        
        # Sample data for dashboard
        categories = ['Enzyme 1', 'Enzyme 2', 'Enzyme 3', 'Enzyme 4']
        values = [85, 55, 120, 75]
        
        # Plot 1: Bar chart
        ax1.bar(categories, values, color='skyblue')
        ax1.set_title('Enzyme Activities')
        ax1.tick_params(axis='x', rotation=45)
        
        # Plot 2: Line chart
        x = np.linspace(0, 10, 100)
        y1 = np.sin(x)
        y2 = np.cos(x)
        ax2.plot(x, y1, label='Sin')
        ax2.plot(x, y2, label='Cos')
        ax2.set_title('Trigonometric Functions')
        ax2.legend()
        
        # Plot 3: Pie chart
        sizes = [30, 25, 20, 15, 10]
        labels = ['A', 'B', 'C', 'D', 'E']
        ax3.pie(sizes, labels=labels, autopct='%1.1f%%')
        ax3.set_title('Distribution')
        
        # Plot 4: Scatter plot
        x_scatter = np.random.randn(50)
        y_scatter = np.random.randn(50)
        ax4.scatter(x_scatter, y_scatter, alpha=0.6)
        ax4.set_title('Scatter Plot')
        
        # Plot 5: Histogram
        data_hist = np.random.randn(100)
        ax5.hist(data_hist, bins=20, color='lightgreen', alpha=0.7)
        ax5.set_title('Histogram')
        
        # Plot 6: Box plot
        data_box = [np.random.randn(50) for _ in range(4)]
        ax6.boxplot(data_box)
        ax6.set_title('Box Plot')
        
        # Plot 7: Heatmap
        data_heatmap = np.random.rand(5, 5)
        im = ax7.imshow(data_heatmap, cmap='viridis')
        ax7.set_title('Heatmap')
        plt.colorbar(im, ax=ax7)
        
        # Plot 8: Area chart
        x_area = np.linspace(0, 10, 100)
        y_area1 = np.sin(x_area)
        y_area2 = np.sin(x_area) + 0.5
        ax8.fill_between(x_area, y_area1, y_area2, alpha=0.3)
        ax8.set_title('Area Chart')
        
        # Plot 9: Radar chart (simplified)
        categories_radar = ['A', 'B', 'C', 'D', 'E']
        values_radar = [4, 3, 2, 5, 1]
        angles = np.linspace(0, 2 * np.pi, len(categories_radar), endpoint=False).tolist()
        values_radar += values_radar[:1]
        angles += angles[:1]
        ax9 = fig.add_subplot(gs[2, 2], polar=True)
        ax9.plot(angles, values_radar, 'o-', linewidth=2)
        ax9.fill(angles, values_radar, alpha=0.25)
        ax9.set_xticks(angles[:-1])
        ax9.set_xticklabels(categories_radar)
        ax9.set_title('Radar Chart')
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'research_dashboard.png'), 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def generate_visualization_report(self):
        """Generate visualization report."""
        print("Generating visualization report...")
        
        # Create all plots
        self.plot_enzyme_activity_comparison()
        self.plot_fermentation_kinetics()
        self.plot_yield_optimization()
        self.plot_cost_analysis()
        self.plot_timeline()
        self.create_dashboard()
        
        print(f"All plots saved to {self.output_dir}/")
        print("Visualization report complete!")


def main():
    """Main function to visualize experimental data."""
    print("=" * 60)
    print("Biofuel Research Data Visualization — Experimental Data")
    print("=" * 60)
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')
    output_dir = os.path.join(data_dir, '..', 'output', 'plots')
    os.makedirs(output_dir, exist_ok=True)
    
    visualizer = ResearchDataVisualizer(output_dir=output_dir)
    
    # Load real data if available
    assay_file = os.path.join(data_dir, 'cellulase_assay_data.csv')
    ferment_file = os.path.join(data_dir, 'fermentation_results.csv')
    agri_file = os.path.join(data_dir, 'agricultural_waste_test.csv')
    cal_file = os.path.join(data_dir, 'glucose_calibration.csv')
    
    print("\n1. Plotting enzyme activity comparison...")
    if os.path.exists(assay_file):
        assay_data = pd.read_csv(assay_file)
        enzyme_summary = assay_data.groupby('Isolate').agg({
            'Specific_Activity_U_mg': 'mean',
            'Temperature_C': 'first',
            'pH': 'first'
        }).reset_index()
        visualizer.plot_enzyme_activity_comparison(enzyme_summary.rename(columns={
            'Isolate': 'Enzyme_Type',
            'Specific_Activity_U_mg': 'Activity_U_mg',
            'Temperature_C': 'Optimal_Temp_C',
            'pH': 'Optimal_pH'
        }))
    else:
        visualizer.plot_enzyme_activity_comparison()
    
    print("\n2. Plotting fermentation kinetics...")
    if os.path.exists(ferment_file):
        ferment_data = pd.read_csv(ferment_file)
        co_culture = ferment_data[ferment_data['Strain'] == 'TF-001+TF-006'].sort_values('Time_h')
        time_data = co_culture['Time_h'].values
        conc_data = {
            'Substrate': co_culture['Substrate_g_L'].values,
            'Product': co_culture['Ethanol_g_L'].values,
            'Cells': co_culture['Biomass_g_L'].values,
            'pH': co_culture['pH'].values
        }
        visualizer.plot_fermentation_kinetics(time_data, conc_data)
    else:
        visualizer.plot_fermentation_kinetics()
    
    print("\n3. Plotting yield optimization...")
    if os.path.exists(agri_file):
        agri_data = pd.read_csv(agri_file)
        pretreated = agri_data[agri_data['Pretreatment'] == 'NaOH']
        grouped = pretreated.groupby('Substrate')['Conversion_Percent'].mean()
        params = np.arange(len(grouped))
        yields_array = grouped.values / 100.0
        visualizer.plot_yield_optimization(params, yields_array)
    else:
        visualizer.plot_yield_optimization()
    
    print("\n4. Plotting cost analysis...")
    visualizer.plot_cost_analysis()
    
    print("\n5. Plotting project timeline...")
    visualizer.plot_timeline()
    
    print("\n6. Creating research dashboard...")
    visualizer.create_dashboard()
    
    print(f"\nAll plots saved to {output_dir}/")
    print("=" * 60)
    print("Visualization complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Bioreactor Simulation Model

This script simulates cellulose-to-ethanol fermentation
in a bioreactor using termite-derived enzymes.

Author: Biofuel Research Team
Date: [Current Date]
Version: 1.0
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint
from scipy.optimize import minimize
import pandas as pd
import json
import os
from datetime import datetime


class BioreactorSimulator:
    """Simulator for cellulose-to-ethanol fermentation."""
    
    def __init__(self, params=None):
        """Initialize simulator with parameters."""
        # Default parameters (can be overridden)
        self.params = params or {
            # Substrate parameters
            'S0': 100.0,  # Initial cellulose concentration (g/L)
            'E0': 10.0,   # Initial enzyme concentration (FPU/g cellulose)
            
            # Kinetic parameters
            'Vmax': 0.5,  # Maximum reaction rate (g/L/h)
            'Km': 20.0,   # Michaelis constant (g/L)
            'Ki': 5.0,    # Product inhibition constant (g/L)
            
            # Microbial parameters
            'Yxs': 0.1,   # Cell yield (g cells/g substrate)
            'Yps': 0.45,  # Product yield (g product/g substrate)
            'mu_max': 0.2, # Maximum specific growth rate (1/h)
            'Ks': 5.0,    # Substrate affinity constant (g/L)
            
            # Reactor parameters
            'V': 1.0,     # Reactor volume (L)
            'D': 0.0,     # Dilution rate (1/h) for continuous mode
            
            # Environmental parameters
            'T': 37.0,    # Temperature (°C)
            'pH': 6.5,    # pH
            'DO': 0.0,    # Dissolved oxygen (mg/L) - anaerobic
        }
        
        self.time = None
        self.solution = None
        self.results = {}
    
    def ode_system(self, y, t, params):
        """Define ODE system for fermentation."""
        S, X, P = y  # Substrate, Cells, Product
        
        # Unpack parameters
        Vmax = params['Vmax']
        Km = params['Km']
        Ki = params['Ki']
        Yxs = params['Yxs']
        Yps = params['Yps']
        mu_max = params['mu_max']
        Ks = params['Ks']
        D = params['D']
        
        # Specific growth rate (Monod kinetics with product inhibition)
        mu = mu_max * S / (Ks + S) * (1 - P/Ki)
        
        # Enzymatic hydrolysis rate (Michaelis-Menten with product inhibition)
        r_hydrolysis = Vmax * S / (Km + S) * (1 - P/Ki)
        
        # ODEs
        dSdt = -r_hydrolysis * X + D * (self.params['S0'] - S)
        dXdt = mu * X - D * X
        dPdt = Yps * r_hydrolysis * X - D * P
        
        return [dSdt, dXdt, dPdt]
    
    def simulate_batch(self, time_span=72, time_points=100):
        """Simulate batch fermentation."""
        # Initial conditions
        S0 = self.params['S0']
        X0 = 0.1  # Initial cell concentration (g/L)
        P0 = 0.0  # Initial product concentration (g/L)
        y0 = [S0, X0, P0]
        
        # Time span
        self.time = np.linspace(0, time_span, time_points)
        
        # Solve ODE system
        self.solution = odeint(self.ode_system, y0, self.time, args=(self.params,))
        
        # Extract results
        S, X, P = self.solution.T
        
        # Calculate additional parameters
        substrate_consumed = S0 - S
        product_formed = P
        cell_growth = X - X0
        
        # Store results
        self.results = {
            'time': self.time,
            'substrate': S,
            'cells': X,
            'product': P,
            'substrate_consumed': substrate_consumed,
            'cell_growth': cell_growth,
            'yield_ps': P / (S0 - S + 1e-10),  # Product yield
            'productivity': P / self.time,  # Volumetric productivity
        }
        
        return self.results
    
    def simulate_fed_batch(self, time_span=96, feed_rate=1.0, feed_conc=50.0, time_points=100):
        """Simulate fed-batch fermentation."""
        # Initial conditions
        S0 = self.params['S0']
        X0 = 0.1
        P0 = 0.0
        y0 = [S0, X0, P0]
        
        # Time span
        self.time = np.linspace(0, time_span, time_points)
        
        # Solve ODE system with feeding
        def fed_batch_ode(y, t, params):
            S, X, P = y
            
            # Unpack parameters
            Vmax = params['Vmax']
            Km = params['Km']
            Ki = params['Ki']
            Yxs = params['Yxs']
            Yps = params['Yps']
            mu_max = params['mu_max']
            Ks = params['Ks']
            
            # Specific growth rate
            mu = mu_max * S / (Ks + S) * (1 - P/Ki)
            
            # Enzymatic hydrolysis rate
            r_hydrolysis = Vmax * S / (Km + S) * (1 - P/Ki)
            
            # Feeding term (constant feed rate)
            feed = feed_rate * feed_conc / (params['V'] + feed_rate * t)
            
            # ODEs
            dSdt = -r_hydrolysis * X + feed
            dXdt = mu * X
            dPdt = Yps * r_hydrolysis * X
            
            return [dSdt, dXdt, dPdt]
        
        # Solve ODE system
        self.solution = odeint(fed_batch_ode, y0, self.time, args=(self.params,))
        
        # Extract results
        S, X, P = self.solution.T
        
        # Store results
        self.results = {
            'time': self.time,
            'substrate': S,
            'cells': X,
            'product': P,
            'feed_rate': feed_rate,
            'feed_conc': feed_conc,
        }
        
        return self.results
    
    def plot_results(self, title="Bioreactor Simulation"):
        """Plot simulation results."""
        if self.results is None or len(self.results) == 0:
            print("No results to plot. Run simulation first.")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle(title, fontsize=16)
        
        # Plot 1: Substrate and Product
        ax1 = axes[0, 0]
        ax1.plot(self.results['time'], self.results['substrate'], 'b-', label='Cellulose', linewidth=2)
        ax1.plot(self.results['time'], self.results['product'], 'r-', label='Ethanol', linewidth=2)
        ax1.set_xlabel('Time (hours)')
        ax1.set_ylabel('Concentration (g/L)')
        ax1.set_title('Substrate and Product Concentrations')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Cell Growth
        ax2 = axes[0, 1]
        ax2.plot(self.results['time'], self.results['cells'], 'g-', label='Cell Mass', linewidth=2)
        ax2.set_xlabel('Time (hours)')
        ax2.set_ylabel('Cell Concentration (g/L)')
        ax2.set_title('Cell Growth')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: Product Yield
        ax3 = axes[1, 0]
        ax3.plot(self.results['time'], self.results['yield_ps'], 'm-', label='Product Yield', linewidth=2)
        ax3.set_xlabel('Time (hours)')
        ax3.set_ylabel('Yield (g product/g substrate)')
        ax3.set_title('Product Yield over Time')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Plot 4: Productivity
        ax4 = axes[1, 1]
        # Avoid division by zero
        productivity = np.where(self.results['time'] > 0, 
                               self.results['product'] / self.results['time'], 0)
        ax4.plot(self.results['time'], productivity, 'c-', label='Volumetric Productivity', linewidth=2)
        ax4.set_xlabel('Time (hours)')
        ax4.set_ylabel('Productivity (g/L/h)')
        ax4.set_title('Volumetric Productivity')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('bioreactor_simulation_results.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def calculate_theoretical_yield(self):
        """Calculate theoretical maximum yield."""
        # Stoichiometric yield based on cellulose to ethanol
        # C6H10O5 + H2O → 2 C2H5OH + 2 CO2
        # Molecular weights: Cellulose = 162, Ethanol = 46
        theoretical_yield = (2 * 46) / 162  # g ethanol / g cellulose
        
        self.results['theoretical_yield'] = theoretical_yield
        print(f"Theoretical maximum yield: {theoretical_yield:.3f} g ethanol/g cellulose")
        
        return theoretical_yield
    
    def optimize_parameters(self, target_yield=0.4):
        """Optimize parameters to achieve target yield."""
        def objective(params_vector):
            # Unpack parameters
            Vmax, Km, Ki, mu_max = params_vector
            
            # Update parameters
            temp_params = self.params.copy()
            temp_params['Vmax'] = Vmax
            temp_params['Km'] = Km
            temp_params['Ki'] = Ki
            temp_params['mu_max'] = mu_max
            
            # Run simulation
            simulator = BioreactorSimulator(temp_params)
            results = simulator.simulate_batch(time_span=72)
            
            # Calculate final yield
            final_yield = results['product'][-1] / self.params['S0']
            
            # Minimize difference from target yield
            return abs(final_yield - target_yield)
        
        # Initial guess
        x0 = [self.params['Vmax'], self.params['Km'], 
              self.params['Ki'], self.params['mu_max']]
        
        # Bounds
        bounds = [(0.1, 2.0), (5.0, 50.0), (1.0, 20.0), (0.05, 0.5)]
        
        # Optimize
        result = minimize(objective, x0, bounds=bounds, method='L-BFGS-B')
        
        if result.success:
            print(f"Optimization successful!")
            print(f"Optimized Vmax: {result.x[0]:.3f}")
            print(f"Optimized Km: {result.x[1]:.3f}")
            print(f"Optimized Ki: {result.x[2]:.3f}")
            print(f"Optimized mu_max: {result.x[3]:.3f}")
            
            # Update parameters
            self.params['Vmax'] = result.x[0]
            self.params['Km'] = result.x[1]
            self.params['Ki'] = result.x[2]
            self.params['mu_max'] = result.x[3]
            
            return result.x
        else:
            print(f"Optimization failed: {result.message}")
            return None
    
    def sensitivity_analysis(self, parameter='Vmax', variation_range=0.5, points=10):
        """Perform sensitivity analysis on a parameter."""
        original_value = self.params[parameter]
        variations = np.linspace(1 - variation_range, 1 + variation_range, points)
        
        results = []
        
        for var in variations:
            # Update parameter
            self.params[parameter] = original_value * var
            
            # Run simulation
            simulator = BioreactorSimulator(self.params)
            sim_results = simulator.simulate_batch(time_span=72)
            
            # Calculate metrics
            final_product = sim_results['product'][-1]
            final_yield = final_product / self.params['S0']
            
            results.append({
                'variation': var,
                'parameter_value': self.params[parameter],
                'final_product': final_product,
                'final_yield': final_yield
            })
        
        # Restore original parameter
        self.params[parameter] = original_value
        
        # Plot sensitivity analysis
        df = pd.DataFrame(results)
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        ax1.plot(df['parameter_value'], df['final_product'], 'o-', linewidth=2)
        ax1.set_xlabel(f'{parameter} Value')
        ax1.set_ylabel('Final Product Concentration (g/L)')
        ax1.set_title(f'Sensitivity Analysis: {parameter}')
        ax1.grid(True, alpha=0.3)
        
        ax2.plot(df['parameter_value'], df['final_yield'], 'o-', linewidth=2, color='green')
        ax2.set_xlabel(f'{parameter} Value')
        ax2.set_ylabel('Final Product Yield')
        ax2.set_title(f'Sensitivity Analysis: {parameter}')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(f'sensitivity_analysis_{parameter}.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        return df
    
    def generate_report(self, output_file='bioreactor_simulation_report.json'):
        """Generate simulation report."""
        report = {
            'simulation_date': datetime.now().isoformat(),
            'parameters': self.params,
            'results_summary': {
                'final_product_concentration': float(self.results['product'][-1]),
                'final_substrate_concentration': float(self.results['substrate'][-1]),
                'final_cell_concentration': float(self.results['cells'][-1]),
                'product_yield': float(self.results['yield_ps'][-1]),
                'theoretical_yield': self.results.get('theoretical_yield', None)
            }
        }
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to {output_file}")
        return report
    
    def export_results(self, output_file='bioreactor_simulation_results.csv'):
        """Export results to CSV file."""
        df = pd.DataFrame({
            'Time_h': self.results['time'],
            'Substrate_g_L': self.results['substrate'],
            'Cells_g_L': self.results['cells'],
            'Product_g_L': self.results['product'],
            'Yield': self.results['yield_ps']
        })
        
        df.to_csv(output_file, index=False)
        print(f"Results exported to {output_file}")
        return df


def main():
    """Main function to run simulation with calibrated parameters from experimental data."""
    print("=" * 60)
    print("Bioreactor Simulation — Calibrated from Experimental Results")
    print("=" * 60)
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')
    ferment_file = os.path.join(data_dir, 'fermentation_results.csv')
    
    # Calibrate parameters from experimental data if available
    params = {
        'S0': 100.0,
        'E0': 10.0,
        'Vmax': 0.85,
        'Km': 15.0,
        'Ki': 8.0,
        'Yxs': 0.1,
        'Yps': 0.45,
        'mu_max': 0.25,
        'Ks': 5.0,
        'V': 5.0,
        'D': 0.0,
        'T': 37.0,
        'pH': 6.5,
        'DO': 0.0,
    }
    
    if os.path.exists(ferment_file):
        exp_data = pd.read_csv(ferment_file)
        co_culture = exp_data[exp_data['Strain'] == 'TF-001+TF-006']
        if len(co_culture) > 0:
            max_ethanol = co_culture['Ethanol_g_L'].max()
            final_conv = (co_culture['Substrate_g_L'].iloc[0] - co_culture['Substrate_g_L'].iloc[-1]) / co_culture['Substrate_g_L'].iloc[0]
            params['Yps'] = max_ethanol / (co_culture['Substrate_g_L'].iloc[0] - co_culture['Substrate_g_L'].iloc[-1] + 1e-6)
            print(f"  Calibrated from experiment: ethanol yield = {params['Yps']:.3f} g/g, conversion = {final_conv*100:.1f}%")
    
    simulator = BioreactorSimulator(params)
    
    print("\n1. Running batch fermentation simulation...")
    results = simulator.simulate_batch(time_span=72)
    
    print("\n2. Plotting simulation results...")
    simulator.plot_results("Batch Fermentation — Calibrated Model")
    
    print("\n3. Calculating theoretical yield...")
    simulator.calculate_theoretical_yield()
    
    print("\n4. Performing sensitivity analysis on Vmax...")
    sensitivity_results = simulator.sensitivity_analysis(parameter='Vmax')
    
    print("\n5. Performing sensitivity analysis on enzyme loading...")
    simulator.sensitivity_analysis(parameter='Yps', variation_range=0.3)
    
    output_dir = os.path.join(data_dir, '..', 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    print("\n6. Generating report...")
    simulator.generate_report(output_file=os.path.join(output_dir, 'bioreactor_simulation_report.json'))
    
    print("\n7. Exporting results...")
    simulator.export_results(output_file=os.path.join(output_dir, 'bioreactor_simulation_results.csv'))
    
    print("\n" + "=" * 60)
    print("Simulation complete!")
    print("=" * 60)
    
    return simulator, results


if __name__ == "__main__":
    simulator, results = main()

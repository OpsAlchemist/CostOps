/**
 * # Feature: costops-enhancements, Property 4: Provider-specific UI form updates
 *
 * **Validates: Requirements 2.2, 2.3, 2.4**
 *
 * Tests that selecting a cloud provider updates the available services
 * and regions displayed in the CostCalculator UI.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CostCalculator } from '../CostCalculator';

function renderCalculator() {
  return render(
    <BrowserRouter>
      <CostCalculator />
    </BrowserRouter>,
  );
}

/** Helper: find the Region <select> by locating its label text then the sibling select */
function getRegionSelect(): HTMLSelectElement {
  // The component renders labels with text "REGION" (uppercase via CSS class).
  // The label and select are siblings inside a wrapper div.
  // We find the label by text, then grab the select in the same container.
  const labels = screen.getAllByText(/^region$/i);
  for (const label of labels) {
    const container = label.closest('div');
    if (container) {
      const select = container.querySelector('select');
      if (select) return select as HTMLSelectElement;
    }
  }
  throw new Error('Could not find Region select element');
}

function getRegionValues(): string[] {
  const select = getRegionSelect();
  return Array.from(select.options).map(o => o.value);
}

describe('Property 4: Provider-specific UI form updates', () => {
  it('shows AWS services and regions by default', () => {
    renderCalculator();

    // AWS service buttons visible
    expect(screen.getByRole('button', { name: /EC2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lambda/i })).toBeInTheDocument();

    // AWS regions in the region dropdown
    const regionValues = getRegionValues();
    expect(regionValues).toContain('us-east-1');
    expect(regionValues).toContain('eu-west-1');
  });

  it('shows Azure services and regions when Azure is selected', async () => {
    const user = userEvent.setup();
    renderCalculator();

    await user.click(screen.getByRole('button', { name: /Azure/i }));

    // Azure service buttons visible
    expect(screen.getByRole('button', { name: /Virtual Machines/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Blob Storage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Functions/i })).toBeInTheDocument();

    // Azure regions in the region dropdown
    const regionValues = getRegionValues();
    expect(regionValues).toContain('eastus');
    expect(regionValues).toContain('westeurope');
  });

  it('shows GCP services and regions when GCP is selected', async () => {
    const user = userEvent.setup();
    renderCalculator();

    await user.click(screen.getByRole('button', { name: /GCP/i }));

    // GCP service buttons visible
    expect(screen.getByRole('button', { name: /Compute Engine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cloud Storage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cloud Functions/i })).toBeInTheDocument();

    // GCP regions in the region dropdown
    const regionValues = getRegionValues();
    expect(regionValues).toContain('us-central1');
    expect(regionValues).toContain('europe-west1');
  });

  it('switching providers changes the available services', async () => {
    const user = userEvent.setup();
    renderCalculator();

    // Start with AWS — EC2 should be visible
    expect(screen.getByRole('button', { name: /EC2/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Virtual Machines/i })).not.toBeInTheDocument();

    // Switch to Azure
    await user.click(screen.getByRole('button', { name: /Azure/i }));
    expect(screen.getByRole('button', { name: /Virtual Machines/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /EC2/i })).not.toBeInTheDocument();

    // Switch to GCP
    await user.click(screen.getByRole('button', { name: /GCP/i }));
    expect(screen.getByRole('button', { name: /Compute Engine/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Virtual Machines/i })).not.toBeInTheDocument();
  });
});

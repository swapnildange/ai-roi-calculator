// Pricing Tiers Configuration
const PRICING_TIERS = {
    basic: {
        name: "Basic Plan",
        price: 299,
        maxTickets: 2000,
        features: [
            "Up to 2,000 tickets/month",
            "24-hour response time",
            "Email support integration",
            "Basic analytics dashboard",
            "1 language support"
        ]
    },
    pro: {
        name: "Professional Plan",
        price: 599,
        maxTickets: 5000,
        features: [
            "Up to 5,000 tickets/month",
            "Instant response time",
            "Multi-channel support (Email, Chat, Social)",
            "Advanced analytics & reporting",
            "3 language support",
            "CRM integration"
        ]
    },
    enterprise: {
        name: "Enterprise Plan",
        price: 1299,
        maxTickets: Infinity,
        features: [
            "Unlimited tickets",
            "Instant response time",
            "Full omnichannel support",
            "Custom AI training",
            "Unlimited languages",
            "Dedicated account manager",
            "API access",
            "Priority support"
        ]
    }
};

// Constants for calculations
const AUTOMATION_TIME_SAVINGS = 0.80; // 80% time saved per ticket
const CONVERSION_IMPROVEMENT = 0.25; // 25% improvement in conversion
const HOURS_PER_TICKET_MANUAL = 0.25; // 15 minutes per ticket manually

// Chart instance
let savingsChart;

// Track current time unit for response time manual input
let currentTimeUnit = 'mins'; // 'mins' or 'hours'

// Function to switch time unit
function switchTimeUnit(unit) {
    const manualInput = document.getElementById('avgResponseTimeManual');
    const currentMinutes = parseFloat(manualInput.value) || 0;
    
    // Convert current value based on unit change
    if (currentTimeUnit === 'mins' && unit === 'hours') {
        // Converting from minutes to hours
        manualInput.value = (currentMinutes / 60).toFixed(2);
        manualInput.max = 48;
        manualInput.placeholder = 'Enter hours';
    } else if (currentTimeUnit === 'hours' && unit === 'mins') {
        // Converting from hours to minutes
        manualInput.value = Math.round(currentMinutes * 60);
        manualInput.max = 2880;
        manualInput.placeholder = 'Enter minutes';
    }
    
    // Update unit tracking
    currentTimeUnit = unit;
    
    // Update button states
    document.getElementById('unitMins').classList.toggle('active', unit === 'mins');
    document.getElementById('unitHours').classList.toggle('active', unit === 'hours');
}

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    initializeInputs();
    calculate();
});

// Response time mapping: 0-60 = minutes (every 1 min), 61-108 = hours (30 min intervals from 1h to 48h)
function sliderToMinutes(sliderValue) {
    sliderValue = parseInt(sliderValue);
    if (sliderValue <= 60) {
        return sliderValue; // 0-60 minutes
    } else {
        // 61-108 maps to 90, 120, 150... up to 2880 (48 hours)
        const halfHourIntervals = sliderValue - 60; // 1-48
        return 60 + (halfHourIntervals * 30); // Start at 90 mins, add 30 each step
    }
}

function minutesToSlider(minutes) {
    minutes = parseInt(minutes);
    if (minutes <= 60) {
        return minutes;
    } else {
        // Convert minutes to half-hour intervals after 60
        const halfHours = Math.floor((minutes - 60) / 30);
        return 60 + halfHours;
    }
}

function formatResponseTime(minutes) {
    if (minutes === 0) return '0 mins';
    if (minutes < 60) return minutes + ' mins';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return hours + (hours === 1 ? ' hour' : ' hours');
    return hours + 'h ' + mins + 'm';
}

function initializeInputs() {
    const inputs = ['monthlyTickets', 'avgResponseTime', 'supportStaff', 'avgStaffCost', 'conversionRate', 'avgOrderValue'];
    
    inputs.forEach(inputId => {
        const slider = document.getElementById(inputId);
        const manualInput = document.getElementById(inputId + 'Manual');
        
        // Slider input listener
        slider.addEventListener('input', function() {
            let value = this.value;
            if (inputId === 'avgResponseTime') {
                value = sliderToMinutes(value);
            }
            updateDisplay(inputId, value);
            updateManualInput(inputId, value);
            calculate();
        });
        
        // Manual input listener
        if (manualInput) {
            manualInput.addEventListener('input', function() {
                let value = parseFloat(this.value);
                if (isNaN(value) || value < 0) return;
                
                // Enforce min/max
                const min = parseFloat(this.getAttribute('min')) || 0;
                const max = parseFloat(this.getAttribute('max')) || Infinity;
                value = Math.min(Math.max(value, min), max);
                
                if (inputId === 'avgResponseTime') {
                    // Convert to minutes based on current unit
                    let valueInMinutes = value;
                    if (currentTimeUnit === 'hours') {
                        valueInMinutes = value * 60;
                    }
                    
                    // User enters minutes or hours, convert to slider value
                    slider.value = minutesToSlider(valueInMinutes);
                    updateDisplay(inputId, valueInMinutes);
                } else {
                    slider.value = value;
                    updateDisplay(inputId, value);
                }
                calculate();
            });
            
            // Format on blur
            manualInput.addEventListener('blur', function() {
                if (inputId === 'avgOrderValue' && this.value) {
                    this.value = parseFloat(this.value).toFixed(2);
                } else if (inputId === 'avgResponseTime' && this.value && currentTimeUnit === 'hours') {
                    this.value = parseFloat(this.value).toFixed(2);
                }
            });
        }
        
        // Initialize displays
        let initialValue = slider.value;
        if (inputId === 'avgResponseTime') {
            initialValue = sliderToMinutes(initialValue);
            // Set initial attributes for response time manual input
            if (manualInput) {
                manualInput.setAttribute('max', '2880'); // Max 48 hours in minutes
                manualInput.setAttribute('placeholder', 'Enter minutes');
            }
        }
        updateDisplay(inputId, initialValue);
        updateManualInput(inputId, initialValue);
    });
    
    // Add listeners for coverage selects
    document.getElementById('currentCoverage').addEventListener('change', calculate);
    document.getElementById('desiredCoverage').addEventListener('change', calculate);
}

function updateManualInput(inputId, value) {
    const manualInput = document.getElementById(inputId + 'Manual');
    if (!manualInput) return;
    
    if (inputId === 'avgResponseTime') {
        // Display in current unit
        if (currentTimeUnit === 'hours') {
            manualInput.value = (parseFloat(value) / 60).toFixed(2);
        } else {
            manualInput.value = Math.round(value);
        }
    } else if (inputId === 'avgOrderValue') {
        manualInput.value = parseFloat(value).toFixed(2);
    } else if (inputId === 'conversionRate') {
        manualInput.value = parseFloat(value).toFixed(1);
    } else {
        manualInput.value = value;
    }
}

function updateDisplay(inputId, value) {
    const displayElement = document.getElementById(inputId + 'Value');
    let displayValue;
    
    switch(inputId) {
        case 'monthlyTickets':
            displayValue = parseInt(value).toLocaleString();
            break;
        case 'avgResponseTime':
            displayValue = formatResponseTime(parseInt(value));
            break;
        case 'supportStaff':
            displayValue = value + ' people';
            break;
        case 'avgStaffCost':
            displayValue = '$' + parseInt(value).toLocaleString();
            break;
        case 'conversionRate':
            displayValue = parseFloat(value).toFixed(1) + '%';
            break;
        case 'avgOrderValue':
            displayValue = '$' + parseFloat(value).toFixed(2);
            break;
        default:
            displayValue = value;
    }
    
    displayElement.textContent = displayValue;
}

function calculate() {
    // Get input values
    const monthlyTickets = parseInt(document.getElementById('monthlyTickets').value);
    const avgResponseTimeSlider = parseInt(document.getElementById('avgResponseTime').value);
    const avgResponseTime = sliderToMinutes(avgResponseTimeSlider); // Convert to actual minutes
    const supportStaff = parseInt(document.getElementById('supportStaff').value);
    const avgStaffCost = parseFloat(document.getElementById('avgStaffCost').value);
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) / 100;
    const avgOrderValue = parseFloat(document.getElementById('avgOrderValue').value);
    const currentCoverageHours = parseInt(document.getElementById('currentCoverage').value);
    const desiredCoverageHours = parseInt(document.getElementById('desiredCoverage').value);
    
    // Calculate current costs
    const currentMonthlyCost = supportStaff * avgStaffCost;
    
    // Calculate time saved
    const hoursPerMonth = monthlyTickets * HOURS_PER_TICKET_MANUAL;
    const hoursSaved = hoursPerMonth * AUTOMATION_TIME_SAVINGS;
    
    // Calculate AI-handled workload (80% automation)
    const aiHandledTickets = Math.round(monthlyTickets * AUTOMATION_TIME_SAVINGS);
    const humanHandledTickets = monthlyTickets - aiHandledTickets;
    
    // Calculate staffing based on coverage hours
    // Standard calculation: 1 staff = 160 hours/month productive time (40 hrs/week)
    // But for coverage, we need to account for shifts
    
    // Coverage multiplier: how many people needed to cover the hours
    // 45 hrs/week (9x5) = 1.0x (baseline)
    // 80 hrs/week (16x5) = 2.0x
    // 63 hrs/week (9x7) = 1.4x
    // 112 hrs/week (16x7) = 2.8x
    // 168 hrs/week (24x7) = 4.2x (need multiple shifts + overlap)
    
    const coverageMultiplier = {
        45: 1.0,   // 9x5
        80: 2.0,   // 16x5
        63: 1.4,   // 9x7
        112: 2.8,  // 16x7
        168: 4.2   // 24x7
    };
    
    // With AI: AI provides instant 24/7 coverage automatically
    // But human staff needed for escalations during desired coverage hours
    // If expanding coverage, need staff available during those expanded hours for escalations
    
    // Calculate coverage multiplier for human escalations
    let humanCoverageMultiplier;
    if (desiredCoverageHours === 168) {
        // 24/7 desired: need minimum staff rotation for escalations
        humanCoverageMultiplier = 2.5; // Need ~2-3 people for 24/7 escalation coverage
    } else {
        humanCoverageMultiplier = coverageMultiplier[desiredCoverageHours] || 1.0;
    }
    
    // Calculate optimal staff needed
    // Base: tickets per staff per month (assuming 160 productive hours, 4 tickets/hour)
    const baseTicketsPerStaff = 160 * 4; // 640 tickets
    
    // Adjust for coverage - need staff available for escalations during desired hours
    const optimalStaff = Math.max(1, Math.ceil((humanHandledTickets / baseTicketsPerStaff) * humanCoverageMultiplier));
    
    // Staff can be reduced
    const staffCanReduce = Math.max(0, supportStaff - optimalStaff);
    const staffSavings = staffCanReduce * avgStaffCost;
    
    // Determine recommended plan
    const recommendedPlan = getRecommendedPlan(monthlyTickets);
    const planCost = PRICING_TIERS[recommendedPlan].price;
    
    // Total monthly savings (staff savings minus our cost)
    const monthlySavings = staffSavings - planCost;
    const annualSavings = monthlySavings * 12;
    
    // Calculate revenue increase from improved conversion
    // Faster response times improve conversion rates
    const currentMonthlyRevenue = monthlyTickets * conversionRate * avgOrderValue;
    const newConversionRate = conversionRate * (1 + CONVERSION_IMPROVEMENT);
    const newMonthlyRevenue = monthlyTickets * newConversionRate * avgOrderValue;
    const additionalRevenue = newMonthlyRevenue - currentMonthlyRevenue;
    const additionalAnnualRevenue = additionalRevenue * 12;
    
    // Calculate ROI timeline (months to break even)
    // Total monthly benefit = cost savings + additional revenue
    const totalMonthlyBenefit = monthlySavings + additionalRevenue;
    
    // ROI = months to recover the plan cost through total benefits
    let roiMonths;
    if (totalMonthlyBenefit > 0) {
        roiMonths = planCost / totalMonthlyBenefit; // Keep as decimal for workdays calculation
    } else if (monthlySavings > 0) {
        roiMonths = planCost / monthlySavings;
    } else {
        roiMonths = 12; // Default to 12 months if no positive benefit
    }
    
    // Cap at 12 months maximum but don't force minimum of 1
    roiMonths = Math.min(roiMonths, 12);
    
    // Debug: Log the calculation
    console.log('ROI Calculation:', {
        planCost,
        monthlySavings,
        additionalRevenue,
        totalMonthlyBenefit,
        roiMonths: roiMonths.toFixed(3)
    });
    
    // Update display
    document.getElementById('totalMonthlyBenefit').textContent = '$' + Math.round(totalMonthlyBenefit).toLocaleString();
    document.getElementById('monthlySavings').textContent = '$' + Math.round(monthlySavings).toLocaleString();
    document.getElementById('annualSavings').textContent = '$' + Math.round(annualSavings).toLocaleString();
    document.getElementById('timeSaved').textContent = Math.round(hoursSaved).toLocaleString() + ' hours';
    document.getElementById('additionalRevenue').textContent = '$' + Math.round(additionalRevenue).toLocaleString();
    document.getElementById('additionalAnnualRevenue').textContent = '$' + Math.round(additionalAnnualRevenue).toLocaleString();
    
    // Display ROI in workdays if less than 1 month (22 workdays = 1 month)
    let roiDisplay;
    if (roiMonths < 1) {
        const workdays = Math.ceil(roiMonths * 22); // 22 workdays per month
        roiDisplay = workdays + (workdays === 1 ? ' workday' : ' workdays');
    } else {
        const roundedMonths = Math.ceil(roiMonths);
        roiDisplay = roundedMonths + (roundedMonths === 1 ? ' month' : ' months');
    }
    document.getElementById('roiTimeline').textContent = roiDisplay;
    
    // Update response time display
    document.getElementById('currentResponseTime').textContent = formatResponseTime(avgResponseTime);
    
    // Update conversion rate display
    document.getElementById('currentConversion').textContent = (conversionRate * 100).toFixed(1) + '%';
    document.getElementById('newConversion').textContent = '→ ' + (newConversionRate * 100).toFixed(1) + '%';
    
    // Update staff optimization display
    document.getElementById('currentStaff').textContent = supportStaff + ' staff';
    document.getElementById('optimizedStaff').textContent = '→ ' + optimalStaff + ' staff';
    
    // Generate staff insight message
    generateStaffInsight(supportStaff, optimalStaff, staffCanReduce, aiHandledTickets, humanHandledTickets, monthlyTickets, currentCoverageHours, desiredCoverageHours);
    
    // Update plan recommendation
    updatePlanRecommendation(recommendedPlan);
    
    // Update chart
    updateChart(currentMonthlyCost, planCost, additionalRevenue, monthlySavings);
}

function generateStaffInsight(currentStaff, optimalStaff, reduction, aiTickets, humanTickets, totalTickets, currentCoverage, desiredCoverage) {
    const insightCard = document.getElementById('staffInsight');
    const insightText = document.getElementById('staffInsightText');
    
    const coverageLabels = {
        45: '9×5 business hours',
        80: '16×5 extended weekdays',
        63: '9×7 daily business hours',
        112: '16×7 extended daily',
        168: '24×7 around-the-clock'
    };
    
    const currentCoverageLabel = coverageLabels[currentCoverage];
    const desiredCoverageLabel = coverageLabels[desiredCoverage];
    const coverageUpgrade = desiredCoverage > currentCoverage;
    
    if (reduction === 0 && currentStaff === 1) {
        // Already optimized with 1 staff
        insightCard.style.display = 'block';
        if (coverageUpgrade) {
            insightText.innerHTML = `<strong>Expand coverage smartly!</strong> Upgrading from ${currentCoverageLabel} to ${desiredCoverageLabel}. AI handles ${aiTickets.toLocaleString()} routine queries (${Math.round(aiTickets/totalTickets*100)}%) instantly 24/7. Your single support person only handles ${humanTickets.toLocaleString()} complex escalations during ${desiredCoverageLabel}—but since AI resolves most issues instantly, escalations are rare and manageable with your current staff.`;
        } else {
            insightText.innerHTML = `<strong>Optimal staffing!</strong> With AI handling ${aiTickets.toLocaleString()} tickets (${Math.round(aiTickets/totalTickets*100)}%) instantly during ${desiredCoverageLabel}, your single support person focuses on ${humanTickets.toLocaleString()} complex escalations that truly need human expertise. This makes them more productive and less burned out.`;
        }
    } else if (reduction === 0 && currentStaff > 1) {
        // Can't reduce but can repurpose
        insightCard.style.display = 'block';
        if (coverageUpgrade) {
            insightText.innerHTML = `<strong>Expand coverage with same team!</strong> Upgrading from ${currentCoverageLabel} to ${desiredCoverageLabel}. AI provides instant responses 24/7 for ${Math.round(aiTickets/totalTickets*100)}% of queries. Your ${currentStaff} staff members cover ${desiredCoverageLabel} for escalations and complex cases only—no additional hiring required! Most customers get instant AI help; humans handle the exceptions.`;
        } else {
            insightText.innerHTML = `<strong>Repurpose your team!</strong> While maintaining ${desiredCoverageLabel} coverage with ${currentStaff} staff, AI handles ${Math.round(aiTickets/totalTickets*100)}% of routine queries instantly. Your team becomes an escalation team, focusing only on complex issues that need human expertise—turning support into a strategic, high-value function.`;
        }
    } else if (reduction > 0) {
        // Can reduce staff
        const reductionPercent = Math.round(reduction/currentStaff * 100);
        insightCard.style.display = 'block';
        
        if (coverageUpgrade) {
            insightText.innerHTML = `<strong>Expand AND optimize!</strong> Upgrading from ${currentCoverageLabel} to ${desiredCoverageLabel}. AI provides instant 24/7 responses for ${Math.round(aiTickets/totalTickets*100)}% of queries. You only need ${optimalStaff} staff for escalation coverage during ${desiredCoverageLabel}—that's a ${reductionPercent}% reduction from ${currentStaff} staff while dramatically expanding coverage! Reassign ${reduction} team member${reduction > 1 ? 's' : ''} to growth initiatives.`;
        } else if (optimalStaff === 1) {
            insightText.innerHTML = `<strong>Significant optimization possible!</strong> For ${desiredCoverageLabel} coverage, AI handles ${aiTickets.toLocaleString()} of ${totalTickets.toLocaleString()} queries (${Math.round(aiTickets/totalTickets*100)}%) instantly. You only need ${optimalStaff} person to handle escalations during ${desiredCoverageLabel}—a ${reductionPercent}% reduction from ${currentStaff} staff. Reassign ${reduction} team member${reduction > 1 ? 's' : ''} to revenue-generating work like sales or product development.`;
        } else {
            insightText.innerHTML = `<strong>Smart team optimization!</strong> For ${desiredCoverageLabel} coverage, AI handles ${Math.round(aiTickets/totalTickets*100)}% of queries instantly. Reduce from ${currentStaff} to ${optimalStaff} staff for escalation coverage, freeing ${reduction} person${reduction > 1 ? 's' : ''} for higher-value work. Your team becomes specialists handling only complex cases that need human expertise during ${desiredCoverageLabel}.`;
        }
    }
}

function getRecommendedPlan(monthlyTickets) {
    if (monthlyTickets <= PRICING_TIERS.basic.maxTickets) {
        return 'basic';
    } else if (monthlyTickets <= PRICING_TIERS.pro.maxTickets) {
        return 'pro';
    } else {
        return 'enterprise';
    }
}

function updatePlanRecommendation(planKey) {
    const plan = PRICING_TIERS[planKey];
    const planCard = document.getElementById('recommendedPlan');
    
    let featuresHTML = '<ul>';
    plan.features.forEach(feature => {
        featuresHTML += `<li>${feature}</li>`;
    });
    featuresHTML += '</ul>';
    
    planCard.innerHTML = `
        <div class="plan-name">${plan.name}</div>
        <div class="plan-price">$${plan.price.toLocaleString()}/month</div>
        <div class="plan-features">${featuresHTML}</div>
    `;
}

function updateChart(currentCost, aiCost, additionalRevenue, netSavings) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    if (savingsChart) {
        savingsChart.destroy();
    }
    
    savingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Monthly Cost', 'AI Solution Cost', 'Additional Revenue', 'Net Monthly Savings'],
            datasets: [{
                label: 'Amount ($)',
                data: [currentCost, aiCost, additionalRevenue, netSavings],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(102, 126, 234, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(102, 126, 234, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Cost Comparison & Savings Breakdown',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Modal functions
function showLeadForm() {
    document.getElementById('leadModal').style.display = 'block';
    
    // Pre-fill calculation summary in notes
    const monthlyTickets = document.getElementById('monthlyTickets').value;
    const supportStaff = document.getElementById('supportStaff').value;
    const optimizedStaff = document.getElementById('optimizedStaff').textContent.replace('→ ', '').trim();
    const monthlySavings = document.getElementById('monthlySavings').textContent;
    const currentResponseTime = document.getElementById('currentResponseTime').textContent;
    const currentConversion = document.getElementById('currentConversion').textContent;
    
    document.getElementById('notes').value = `Calculator Results:\n- Monthly Tickets: ${monthlyTickets}\n- Current Staff: ${supportStaff}\n- Optimized Staff: ${optimizedStaff}\n- Current Response Time: ${currentResponseTime}\n- Current Conversion: ${currentConversion}\n- Projected Savings: ${monthlySavings}`;
}

function closeLeadForm() {
    document.getElementById('leadModal').style.display = 'none';
}

function handleLeadSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    const submitButton = event.target.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Collect form data
    const formData = {
        companyName: document.getElementById('companyName').value,
        contactName: document.getElementById('contactName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || 'Not provided',
        platform: document.getElementById('platform').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toLocaleString(),
        calculatorData: {
            monthlyTickets: document.getElementById('monthlyTickets').value,
            supportStaff: document.getElementById('supportStaff').value,
            monthlySavings: document.getElementById('monthlySavings').textContent,
            annualSavings: document.getElementById('annualSavings').textContent,
            recommendedPlan: document.querySelector('.plan-name').textContent,
            planPrice: document.querySelector('.plan-price').textContent
        }
    };
    
    // Check if EmailJS is configured
    const emailJsConfigured = typeof emailjs !== 'undefined' && 
                              typeof EMAILJS_PUBLIC_KEY !== 'undefined' && 
                              EMAILJS_PUBLIC_KEY !== 'GcZ8l4aZ5K8zQdR49';// ENter your_public_key here
    
    if (!emailJsConfigured) {
        // EmailJS not configured - show data in console for now
        console.log('='.repeat(50));
        console.log('📧 NEW LEAD CAPTURED');
        console.log('='.repeat(50));
        console.log('Company:', formData.companyName);
        console.log('Contact:', formData.contactName);
        console.log('Email:', formData.email);
        console.log('Phone:', formData.phone);
        console.log('Platform:', formData.platform);
        console.log('Monthly Tickets:', formData.calculatorData.monthlyTickets);
        console.log('Support Staff:', formData.calculatorData.supportStaff);
        console.log('Monthly Savings:', formData.calculatorData.monthlySavings);
        console.log('Annual Savings:', formData.calculatorData.annualSavings);
        console.log('Recommended Plan:', formData.calculatorData.recommendedPlan);
        console.log('Plan Price:', formData.calculatorData.planPrice);
        console.log('Notes:', formData.notes);
        console.log('Timestamp:', formData.timestamp);
        console.log('='.repeat(50));
        console.log('⚠️ EmailJS not configured yet. Follow EMAIL_SETUP_GUIDE.md to enable email notifications.');
        console.log('='.repeat(50));
        
        alert('✅ Thank you ' + formData.contactName + '!\n\n' +
              'Your quote request has been received.\n' +
              'We\'ll send your custom quote to ' + formData.email + ' within 24 hours.\n\n' +
              '📋 Your Results:\n' +
              '• Monthly Savings: ' + formData.calculatorData.monthlySavings + '\n' +
              '• Recommended Plan: ' + formData.calculatorData.recommendedPlan + '\n\n' +
              '(Developer Note: Check console for lead data. Email sending will work after EmailJS setup.)');
        
        closeLeadForm();
        document.getElementById('leadForm').reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        return;
    }
    
    // Prepare email parameters for YOUR notification
    const adminEmailParams = {
        to_email: 'swapnildange1@gmail.com',
        from_name: formData.contactName,
        company_name: formData.companyName,
        contact_email: formData.email,
        contact_phone: formData.phone,
        platform: formData.platform,
        monthly_tickets: formData.calculatorData.monthlyTickets,
        support_staff: formData.calculatorData.supportStaff,
        optimized_staff: document.getElementById('optimizedStaff').textContent.replace('→ ', '').trim(),
        current_response_time: document.getElementById('currentResponseTime').textContent,
        current_conversion: document.getElementById('currentConversion').textContent,
        new_conversion: document.getElementById('newConversion').textContent.replace('→ ', ''),
        monthly_savings: formData.calculatorData.monthlySavings,
        annual_savings: formData.calculatorData.annualSavings,
        recommended_plan: formData.calculatorData.recommendedPlan,
        plan_price: formData.calculatorData.planPrice,
        notes: formData.notes,
        timestamp: formData.timestamp
    };
    
    // Prepare email parameters for CUSTOMER quote email
    const customerEmailParams = {
        to_email: formData.email,
        to_name: formData.contactName,
        company_name: formData.companyName,
        monthly_savings: formData.calculatorData.monthlySavings,
        annual_savings: formData.calculatorData.annualSavings,
        recommended_plan: formData.calculatorData.recommendedPlan,
        plan_price: formData.calculatorData.planPrice,
        from_email: 'swapnildange1@gmail.com'
    };
    
    // Send both emails using EmailJS
    Promise.all([
        // Email 1: Notification to you
        emailjs.send('service_s061kqh', 'template_mvon0ia', adminEmailParams), //Enter your_service_ID, your_admin_template_id here
        // Email 2: Quote to customer
        emailjs.send('service_s061kqh', 'template_hfxas22', customerEmailParams)  //Enter your_service_ID, your_customer_template_id here
    ])
    .then(function(responses) {
        console.log('Emails sent successfully!', responses);
        
        // Show success message
        alert('✅ Thank you! We\'ve sent your custom quote to ' + formData.email + '\n\nWe\'ll follow up within 24 hours with detailed implementation steps.');
        
        // Close modal and reset form
        closeLeadForm();
        document.getElementById('leadForm').reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    })
    .catch(function(error) {
        console.error('Email sending failed:', error);
        
        // Show error message but still save the lead data
        alert('⚠️ There was an issue sending the emails, but we\'ve saved your information.\n\nWe\'ll contact you at ' + formData.email + ' within 24 hours.\n\nIf urgent, please email us directly at swapnildange1@gmail.com');
        
        // Log to console for backup
        console.log('Lead Data (backup):', formData);
        
        // Close modal and reset
        closeLeadForm();
        document.getElementById('leadForm').reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('leadModal');
    if (event.target === modal) {
        closeLeadForm();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeInputs();
    calculate(); // Run initial calculation with default values
});

const relationshipTime = document.querySelector('#relationship-time span');
const relationshipStartDate = new Date('2026-09-11T00:00:00');

function updateRelationshipTime() {
    if (!relationshipTime) {
        return;
    }

    const now = new Date();
    const start = new Date(relationshipStartDate);

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        const previousMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += previousMonthDays;
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    if (years < 0) {
        years = 0;
        months = 0;
        days = 0;
    }

    const formatUnit = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;

    if (years > 0) {
        relationshipTime.textContent = `${formatUnit(years, 'ano', 'anos')}, ${formatUnit(months, 'mês', 'meses')} e ${formatUnit(days, 'dia', 'dias')}`;
    } else if (months > 0) {
        relationshipTime.textContent = `${formatUnit(months, 'mês', 'meses')} e ${formatUnit(days, 'dia', 'dias')}`;
    } else {
        relationshipTime.textContent = formatUnit(days, 'dia', 'dias');
    }
}

updateRelationshipTime();
setInterval(updateRelationshipTime, 60000);
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validateClientData(clientData) {
    const { name, email, company } = clientData;
    const errors = [];

    if (!name || typeof name !== 'string') {
        errors.push('Name is required and must be a string.');
    }

    if (!validateEmail(email)) {
        errors.push('A valid email is required.');
    }

    if (!company || typeof company !== 'string') {
        errors.push('Company is required and must be a string.');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

function validateJobData(jobData) {
    const { title, description, requirements } = jobData;
    const errors = [];

    if (!title || typeof title !== 'string') {
        errors.push('Job title is required and must be a string.');
    }

    if (!description || typeof description !== 'string') {
        errors.push('Job description is required and must be a string.');
    }

    if (!Array.isArray(requirements) || requirements.length === 0) {
        errors.push('Job requirements must be a non-empty array.');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

module.exports = {
    validateEmail,
    validateClientData,
    validateJobData,
};
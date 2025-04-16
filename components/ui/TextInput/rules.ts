import { RegisterOptions } from "react-hook-form";
import Language from "src/language/Language";

const REGX_EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const REGX_NUMBER = /^[0-9]+$/;

const REGX_PASSWORD = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/

const REGX_CARD_NUMBER = /^[0-9]{16}$/;  
// const REGX_PHONE_NUMBER = /^[0-9]{10}$/;
const REGX_PHONE_NUMBER = /^(0?[1-9]\d{9})$/;
const REGX_CVV = /^[0-9]{3,4}$/;  // 3 or 4 digit CVV
const REGX_EXP_MONTH = /^(0[1-9]|1[0-2])$/;  // 01-12
const REGX_EXP_YEAR = /^20[2-9][0-9]$/;  // 2024-2099

const REGX_AGE = /^(?:[1-9]|[1-9][0-9])$/;  // Validates ages 1-99

// Then add the age validation function
export const AgeValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.age_required,
    pattern: {
        value: REGX_AGE,
        message: Language.invalid_age
    },
    min: {
        value: 6,
        message: Language.minimum_age
    },
    max: {
        value: 140,
        message: Language.maximum_age
    }
})

export const EmailValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.email_required,
    pattern: {
        value: REGX_EMAIL,
        message: Language.invalid_email
    },
})

// Updated validation function
export const validPhoneValidation: (required?: boolean) => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = (required = false) => ({
    validate: (v: string) => {
        // Remove non-digit characters and trim
        v = (v || "")?.replace(/\D/g, '')?.trim();
        
        // Check if phone number is empty and required
        if (required && !v) {
            return Language.phone_required;
        }
        
        // If no value, return true (as it's not required)
        if (!v) return true;
        
        // Check if number starts with 0
        if (v.startsWith('0')) {
            // If starts with 0, must have at least 10 digits (including 0)
            if (v.length < 10) {
                return Language.invalid_phone_zero_start;
            }
        } else {
            // If doesn't start with 0, must be exactly 10 digits
            if (v.length !== 10) {
                return Language.invalid_phone_no_zero;
            }
            
            // Additional check for first digit
            if (!['7', '8', '9'].includes(v[0])) {
                return Language.phone_start_with;
            }
        }
        
        return true;
    }
});

export const PhoneValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.phone_required,
    pattern: {
        value: REGX_PHONE_NUMBER,
        message: `${Language.invalid_phone}, ${Language.min_char_ten}`
    },
})

export const PasswordValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.password_required,
    pattern: {
        value: REGX_PASSWORD,
        message: Language.strong_password
    },
    minLength: {
        value: 5,
        message: Language.must_be_five
    }

})

export const ConfirmPasswordValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.confirm_password_required,
    pattern: {
        value: REGX_PASSWORD,
        message: Language.strong_password
    },
    minLength: {
        value: 5,
        message: Language.must_be_five
    }
})

export const validateEmail = (email: string) => {
    return REGX_EMAIL.test(email);
}

export const validateNumber = (phone: string) => {
    return REGX_NUMBER.test(phone)
}

export const validatePhoneOrEmail = (s: string) => {
    return (validateNumber(s) || validateEmail(s))
}

// Add these new validation functions
export const CardNumberValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.card_number_required,
    pattern: {
        value: REGX_CARD_NUMBER,
        message: Language.invalid_card_number
    },
})

export const CVVValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.cvv_required,
    pattern: {
        value: REGX_CVV,
        message: Language.invalid_cvv
    }
})

export const ExpiryMonthValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.expiry_month_required,
    pattern: {
        value: REGX_EXP_MONTH,
        message: Language.invalid_expiry_month
    }
})

export const ExpiryYearValidations: () => Exclude<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> = () => ({
    required: Language.expiry_year_required,
    pattern: {
        value: REGX_EXP_YEAR,
        message: Language.invalid_expiry_year
    },
    validate: (value: string) => {
        const currentYear = new Date().getFullYear();
        const inputYear = parseInt(value);
        return inputYear >= currentYear || Language.expired_card;
    }
})

// Helper function to validate expiry date
export const validateExpiryDate = (month: string, year: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
    
    const inputYear = parseInt(year);
    const inputMonth = parseInt(month);
    
    if (inputYear < currentYear) return false;
    if (inputYear === currentYear && inputMonth < currentMonth) return false;
    
    return true;
}
import React from 'react';

const FormField = ({ label, ...inputProps }) => {
  return (
    <label>
      {label}
      <input {...inputProps} />
    </label>
  );
};

export default FormField;

import React from 'react';

const ModuleState = ({ children, tone = 'muted' }) => {
  return <p className={`module-state module-state-${tone}`}>{children}</p>;
};

export default ModuleState;

declare module 'bcryptjs';

// Material icons sometimes lack types in ESM builds — provide a loose declaration
declare module '@mui/icons-material/*' {
  const content: any;
  export default content;
}

// Generic wildcard for react-email components if needed
declare module '@react-email/*' {
  const content: any;
  export default content;
}

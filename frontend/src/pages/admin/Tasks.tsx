import { Container, Typography } from "@mui/material";

const Tasks = () => {
  return (
    <Container>
      <Typography variant="h4">Tasks</Typography>
      <Typography>Manage tasks for caseworkers here.</Typography>
    </Container>
  );
};

export default Tasks;
export {}; // ✅ Fix for --isolatedModules

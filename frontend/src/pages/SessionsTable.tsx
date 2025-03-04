import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Chip,
} from "@mui/material";

// Define the Session interface
interface Session {
  _id: string;
  clientName: string;
  sessionLength: number;
  caseWorker: string;
  caseWorkerName?: string;
  tags: string[];
  keyNote: string;
  date: string;
}

// Define props type
interface SessionsTableProps {
  sessions: Session[];
}

const SessionsTable: React.FC<SessionsTableProps> = ({ sessions }) => {
  const navigate = useNavigate();

  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Client Name</TableCell>
            <TableCell>Session Length</TableCell>
            <TableCell>Case Worker</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell>Key Note</TableCell>
            <TableCell>View</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session.clientName || "No name"}</TableCell>
                <TableCell>{session.sessionLength} min</TableCell>
                <TableCell>
                  {session.caseWorkerName || session.caseWorker}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {session.tags && session.tags.length > 0
                      ? session.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))
                      : "No tags"}
                  </Box>
                </TableCell>
                <TableCell>{session.keyNote || "No notes"}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewSession(session._id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No sessions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SessionsTable;

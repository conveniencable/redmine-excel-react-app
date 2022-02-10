import { useCallback } from 'react';
import { useEffect, useState } from 'react';
import { User } from '../models/user.model';

export function useSelectedProjectIds(user: User) {
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  useEffect(() => {
    let selectedIds = user ? (JSON.parse(localStorage.getItem('_selected_project_ids_' + user.id)) as number[]) : null;

    if (selectedIds && selectedIds.length > 0) {
      selectedIds = selectedIds.map(pid => pid - 0).filter(pid => user.projects.find(p => p.id === pid));
    }

    setSelectedProjectIds(selectedIds);
  }, [user]);

  const updateSelectedProjectIds = useCallback(
    (selectedIds: number[]) => {
      setSelectedProjectIds(selectedIds);
      localStorage.setItem('_selected_project_ids_' + user.id, JSON.stringify(selectedIds));
    },
    [user]
  );

  return {
    selectedProjectIds,
    updateSelectedProjectIds
  };
}

import { useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

export interface DocumentFilterState {
  college: string;
  course: string;
  branch: string;
  subject: string;
  year: string;
}

export const EMPTY_FILTERS: DocumentFilterState = {
  college: '',
  course: '',
  branch: '',
  subject: '',
  year: '',
};

export function useDocumentFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const filters: DocumentFilterState = useMemo(() => {
    return {
      college: searchParams.get('filter_college') || '',
      course: searchParams.get('filter_course') || '',
      branch: searchParams.get('filter_branch') || '',
      subject: searchParams.get('filter_subject') || '',
      year: searchParams.get('filter_year') || '',
    };
  }, [searchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.college.trim()) count++;
    if (filters.course.trim()) count++;
    if (filters.branch.trim()) count++;
    if (filters.subject.trim()) count++;
    if (filters.year.trim()) count++;
    return count;
  }, [filters]);

  const setFilters = useCallback(
    (newFilters: Partial<DocumentFilterState>) => {
      const merged: DocumentFilterState = {
        ...filters,
        ...newFilters,
      };

      const params = new URLSearchParams(searchParams);

      if (merged.college.trim()) {
        params.set('filter_college', merged.college.trim());
      } else {
        params.delete('filter_college');
      }

      if (merged.course.trim() && merged.course !== 'All Courses') {
        params.set('filter_course', merged.course.trim());
      } else {
        params.delete('filter_course');
      }

      if (merged.branch.trim() && merged.branch !== 'All Branches') {
        params.set('filter_branch', merged.branch.trim());
      } else {
        params.delete('filter_branch');
      }

      if (merged.subject.trim() && merged.subject !== 'All Subjects') {
        params.set('filter_subject', merged.subject.trim());
      } else {
        params.delete('filter_subject');
      }

      if (merged.year.trim() && merged.year !== 'All Years') {
        params.set('filter_year', merged.year.trim());
      } else {
        params.delete('filter_year');
      }

      if (location.pathname === '/dashboard') {
        setSearchParams(params, { replace: true });
      } else {
        navigate({
          pathname: '/dashboard',
          search: params.toString(),
        });
      }
    },
    [filters, searchParams, location.pathname, setSearchParams, navigate]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('filter_college');
    params.delete('filter_course');
    params.delete('filter_branch');
    params.delete('filter_subject');
    params.delete('filter_year');

    if (location.pathname === '/dashboard') {
      setSearchParams(params, { replace: true });
    } else {
      navigate({
        pathname: '/dashboard',
        search: params.toString(),
      });
    }
  }, [searchParams, location.pathname, setSearchParams, navigate]);

  const removeFilterKey = useCallback(
    (key: keyof DocumentFilterState) => {
      setFilters({ [key]: '' });
    },
    [setFilters]
  );

  return {
    filters,
    activeFilterCount,
    setFilters,
    clearFilters,
    removeFilterKey,
  };
}

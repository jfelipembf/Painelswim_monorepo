import { useState, useEffect } from 'react';
import {
    getAuthUser,
    isOwner,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
} from '../helpers/permission_helper';

/**
 * Hook para acessar permissões do usuário em componentes funcionais
 */
export const usePermissions = () => {
    const [user, setUser] = useState(getAuthUser());

    // Atualiza quando o localStorage mudar (útil para login/logout ou troca de unidade)
    useEffect(() => {
        const handleStorageChange = () => {
            setUser(getAuthUser());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        user,
        isOwner: () => isOwner(),
        hasPermission: (id) => hasPermission(id),
        hasAnyPermission: (ids) => hasAnyPermission(ids),
        hasAllPermissions: (ids) => hasAllPermissions(ids),
        role: user?.role || user?.staff?.role
    };
};

export default usePermissions;

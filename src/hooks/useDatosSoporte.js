'use client';

/**
 * Reune el contexto que acompana al mensaje de soporte por WhatsApp: quien
 * escribe, desde que empresa, con que perfil y desde que pantalla.
 *
 * Devuelve los datos sueltos (no la URL) a proposito: asi el mismo hook sirve
 * para el enlace normal y para el del aviso de cuenta suspendida, que ademas
 * manda "Motivo", sin tener que llamar al hook dos veces ni condicionarlo.
 */

import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useEmpresaNombre } from '@/hooks/useEmpresaNombre';
import { getDashboardRoleFromUser, getDashboardRoleLabel } from '@/lib/dashboard-access';

// useEmpresaNombre cae a este valor cuando no hay API o falla la peticion. Como
// nombre de empresa no dice nada (es el nombre del producto), en el mensaje de
// soporte preferimos omitir la linea antes que mandar ruido.
const EMPRESA_SIN_DATO = 'AgendaClínica';

export function useDatosSoporte() {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const empresaNombre = useEmpresaNombre();

    return useMemo(() => {
        if (!isLoaded || !user) {
            return { pantalla: pathname || '' };
        }

        const correo =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            '';

        return {
            nombre: user.fullName || user.firstName || '',
            correo,
            empresa: empresaNombre === EMPRESA_SIN_DATO ? '' : empresaNombre,
            perfil: getDashboardRoleLabel(getDashboardRoleFromUser(user)),
            pantalla: pathname || '',
        };
    }, [isLoaded, user, empresaNombre, pathname]);
}

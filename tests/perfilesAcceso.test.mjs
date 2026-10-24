import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessDashboardPath,
  canAccessOdontograma,
  canAccessRecetasEnFicha,
  getCreatableDashboardRoles,
  getDashboardRoleFromClaims,
  getDashboardRoleFromUser,
  getDashboardRoleLabel,
  routeMatchersByRole,
} from "../src/lib/dashboard-access.js";

const ADMINISTRADOR_CLINICO = "administrador-clinico";
const ADMINISTRADOR_ODONTOLOGICO = "administrador-odontologico";

test("administrador odontológico conserva los permisos del administrador clínico", () => {
  const rutasClinicas = routeMatchersByRole[ADMINISTRADOR_CLINICO].map(String);
  const rutasOdontologicas = routeMatchersByRole[ADMINISTRADOR_ODONTOLOGICO].map(String);

  assert.deepEqual(rutasOdontologicas.slice(0, -1), rutasClinicas);
  assert.equal(canAccessRecetasEnFicha(ADMINISTRADOR_ODONTOLOGICO), canAccessRecetasEnFicha(ADMINISTRADOR_CLINICO));
  assert.equal(canAccessDashboardPath(ADMINISTRADOR_ODONTOLOGICO, "/dashboard/createUser"), false);
  assert.equal(canAccessDashboardPath(ADMINISTRADOR_ODONTOLOGICO, "/dashboard/pasarelaPago"), false);
});

test("administrador odontológico puede abrir y usar el odontograma sin acceder al periodontograma", () => {
  assert.equal(canAccessOdontograma(ADMINISTRADOR_CLINICO), false);
  assert.equal(canAccessOdontograma(ADMINISTRADOR_ODONTOLOGICO), true);
  assert.equal(canAccessDashboardPath(ADMINISTRADOR_CLINICO, "/dashboard/odontogramasPaciente/123"), false);
  assert.equal(canAccessDashboardPath(ADMINISTRADOR_ODONTOLOGICO, "/dashboard/odontogramasPaciente/123"), true);
  assert.equal(canAccessDashboardPath(ADMINISTRADOR_ODONTOLOGICO, "/dashboard/periodontogramaPaciente"), false);
});

test("administrador odontológico puede asignarse y leerse desde Clerk", () => {
  assert.equal(getCreatableDashboardRoles().some(({ value }) => value === ADMINISTRADOR_ODONTOLOGICO), true);
  assert.equal(getDashboardRoleLabel(ADMINISTRADOR_ODONTOLOGICO), "Administrador Odontológico");
  assert.equal(getDashboardRoleFromClaims({ metadata: { role: ADMINISTRADOR_ODONTOLOGICO } }), ADMINISTRADOR_ODONTOLOGICO);
  assert.equal(getDashboardRoleFromUser({ publicMetadata: { role: ADMINISTRADOR_ODONTOLOGICO } }), ADMINISTRADOR_ODONTOLOGICO);
});

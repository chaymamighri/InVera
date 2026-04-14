package org.erp.invera.repository.erp;

import org.erp.invera.model.erp.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;


@Repository
public interface LigneCommandeFournisseurRepository extends JpaRepository<LigneCommandeFournisseur, Integer> {

}
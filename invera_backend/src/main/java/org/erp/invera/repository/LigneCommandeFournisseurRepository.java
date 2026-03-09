package org.erp.invera.repository;

import org.erp.invera.model.Fournisseurs.LigneCommandeFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;


@Repository
public interface LigneCommandeFournisseurRepository extends JpaRepository<LigneCommandeFournisseur, Integer> {

}
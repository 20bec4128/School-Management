package com.School.School_management.Repository;

import com.School.School_management.Entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findBySaleIdOrderByIdAsc(Long saleId);
    void deleteBySaleId(Long saleId);
}
